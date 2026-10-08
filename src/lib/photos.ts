import "server-only";
import { articlesFor } from "@/lib/catalog/photo-articles";

/**
 * Real photography from Wikipedia / Wikimedia Commons. Every image used is
 * freely licensed (Wikipedia's lead images are Commons files), and we keep the
 * author and licence so each photo can be credited. Lookups are cached for a
 * week; if Wikipedia is unreachable we return null and callers fall back to
 * the built-in illustrations.
 */

export interface Photo {
  src: string;
  width: number;
  height: number;
  /** Plain-text author, e.g. "Jane Doe". */
  author: string;
  /** Short licence name, e.g. "CC BY-SA 4.0". */
  license: string;
  /** Commons file page with full attribution. */
  sourceUrl: string;
}

export const AIRPLANE_ARTICLE = "Airbus A350";

const API = "https://en.wikipedia.org/w/api.php";
const WEEK = 60 * 60 * 24 * 7;
const HEADERS = { "User-Agent": "SkyScout/1.0 (https://skyscout-six.vercel.app)" };

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

interface ApiPage {
  title: string;
  pageimage?: string;
  imageinfo?: {
    thumburl?: string;
    thumbwidth?: number;
    thumbheight?: number;
    descriptionurl?: string;
    mime?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
}

interface Rename {
  from: string;
  to: string;
}

async function query(params: Record<string, string>): Promise<{ pages: ApiPage[]; renames: Rename[] }> {
  const url = `${API}?${new URLSearchParams({ action: "query", format: "json", formatversion: "2", redirects: "1", ...params })}`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: WEEK }, signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  const data = (await res.json()) as { query?: { pages?: ApiPage[]; normalized?: Rename[]; redirects?: Rename[] } };
  return {
    pages: data.query?.pages ?? [],
    renames: [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])],
  };
}

/** Lead photos for several articles at once, keyed by article title. */
async function photosForArticles(titles: string[], width: number): Promise<Map<string, Photo>> {
  const out = new Map<string, Photo>();
  try {
    // 1. Which free image leads each article?
    const { pages, renames } = await query({ prop: "pageimages", piprop: "name", pilicense: "free", titles: titles.join("|") });
    const fileByTitle = new Map<string, string>();
    for (const page of pages) if (page.pageimage) fileByTitle.set(page.title, page.pageimage);
    // Follow normalisation and redirects from each requested title to its page.
    const resolve = (title: string) => {
      let t = title;
      for (let i = 0; i < 3; i++) t = renames.find((r) => r.from === t)?.to ?? t;
      return t;
    };

    // 2. A resized URL, author and licence for each file.
    const files = [...new Set(fileByTitle.values())];
    if (files.length === 0) return out;
    const { pages: infos } = await query({
      prop: "imageinfo",
      iiprop: "url|mime|extmetadata",
      iiurlwidth: String(width),
      iiextmetadatafilter: "Artist|LicenseShortName",
      titles: files.map((f) => `File:${f}`).join("|"),
    });
    const photoByFile = new Map<string, Photo>();
    for (const info of infos) {
      const ii = info.imageinfo?.[0];
      // Photos only: skip maps, flags and diagrams.
      if (!ii?.thumburl || !ii.mime || !/^image\/(jpeg|webp)$/.test(ii.mime)) continue;
      photoByFile.set(info.title.replace(/^File:/, "").replace(/ /g, "_"), {
        src: ii.thumburl,
        width: ii.thumbwidth ?? width,
        height: ii.thumbheight ?? Math.round(width * 0.66),
        author: stripHtml(ii.extmetadata?.Artist?.value ?? "") || "Unknown author",
        license: stripHtml(ii.extmetadata?.LicenseShortName?.value ?? "") || "see source",
        sourceUrl: ii.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(info.title)}`,
      });
    }
    for (const t of titles) {
      const file = fileByTitle.get(resolve(t));
      const photo = file ? photoByFile.get(file.replace(/ /g, "_")) : undefined;
      if (photo) out.set(t, photo);
    }
  } catch (error) {
    console.warn("[photos] Wikipedia lookup failed, using illustrations:", error instanceof Error ? error.message : error);
  }
  return out;
}

/** Photos for destination airports (IATA codes); missing ones are omitted. */
export async function getDestinationPhotos(codes: string[], width = 480): Promise<Record<string, Photo>> {
  const wanted = codes.filter((c) => articlesFor(c).length > 0);
  if (wanted.length === 0) return {};
  const byTitle = await photosForArticles([...new Set(wanted.flatMap(articlesFor))], width);
  const out: Record<string, Photo> = {};
  for (const c of wanted) {
    const photo = articlesFor(c)
      .map((t) => byTitle.get(t))
      .find(Boolean);
    if (photo) out[c] = photo;
  }
  return out;
}

export async function getAirplanePhoto(width = 1200): Promise<Photo | null> {
  return (await photosForArticles([AIRPLANE_ARTICLE], width)).get(AIRPLANE_ARTICLE) ?? null;
}
