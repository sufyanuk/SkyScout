export const SITE = {
  name: "SkyScout",
  tagline: "Find flights worth flying for.",
  description:
    "SkyScout helps you discover unusually cheap flights and unexpected destinations. Explore fares from your airport, compare deals and get alerts when prices drop.",
  url: (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
  ).replace(/\/$/, ""),
};

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
