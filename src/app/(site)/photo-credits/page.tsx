import type { Metadata } from "next";
import Link from "next/link";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import { getDestinationPhotos } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Photo credits",
  description: "Credits and licences for the destination photos used on SkyScout.",
  alternates: { canonical: "/photo-credits" },
};

export default async function PhotoCreditsPage() {
  const photos = await getDestinationPhotos(DESTINATIONS.map((d) => d.airport));
  const rows = DESTINATIONS.filter((d) => photos[d.airport]).map((d) => ({
    key: d.slug,
    label: `${d.city}, ${d.country}`,
    photo: photos[d.airport],
  }));

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Photo credits</h1>
      <p className="mt-2 text-muted-foreground">
        Photos on SkyScout are freely licensed images from Wikimedia Commons, used under the licences below. Follow a
        link for the full attribution and licence terms.
      </p>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Photo details are temporarily unavailable. Please try again later.</p>
      ) : (
        <ul className="mt-8 divide-y rounded-3xl border bg-card px-5 shadow-card">
          {rows.map(({ key, label, photo }) => (
            <li key={key} className="flex items-center gap-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- served straight from Wikimedia's CDN */}
              <img src={photo.src} alt={label} loading="lazy" className="size-14 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{label}</p>
                <p className="truncate text-muted-foreground">
                  <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    {photo.author}
                  </a>{" "}
                  · {photo.license}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm">
        <Link href="/destinations" className="font-semibold text-primary hover:underline">
          Browse destinations
        </Link>
      </p>
    </div>
  );
}
