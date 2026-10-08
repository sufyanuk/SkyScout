import { NextResponse } from "next/server";
import { getDestinationPhotos } from "@/lib/photos";

const WIDTHS = [500, 960, 1920];

/**
 * Redirects to a destination's photo on Wikimedia's CDN, so any component can
 * show it with a plain URL. 404 when there's no photo (callers keep their
 * illustration).
 */
export async function GET(request: Request, ctx: RouteContext<"/api/photos/[code]">) {
  const { code } = await ctx.params;
  const asked = Number(new URL(request.url).searchParams.get("w")) || 500;
  const width = WIDTHS.find((w) => w >= asked) ?? WIDTHS[WIDTHS.length - 1];
  const photo = (await getDestinationPhotos([code.toUpperCase()], width))[code.toUpperCase()];
  if (!photo) return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  return NextResponse.redirect(photo.src, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
  });
}
