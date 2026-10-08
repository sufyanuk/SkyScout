import type { MetadataRoute } from "next";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/deals"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/explore"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/destinations"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/alerts"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
  return [
    ...pages,
    ...DESTINATIONS.map((d) => ({
      url: absoluteUrl(`/destinations/${d.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
