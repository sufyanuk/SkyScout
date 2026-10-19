import { NextResponse } from "next/server";
import { bookingLink, ignavConfigured } from "@/lib/flights/ignav/ignav-provider";

export const dynamic = "force-dynamic";

/**
 * "Book" button for Ignav fares: looks up the partner booking page for an
 * itinerary and redirects there. Booking links are billed per request, so
 * they're fetched only when someone actually clicks.
 *   GET /api/ignav/book?id=<ignav_id>
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!ignavConfigured()) return new NextResponse("Live booking isn't available right now.", { status: 503 });
  if (!id || id.length > 512) return new NextResponse("Missing or invalid itinerary id.", { status: 400 });
  try {
    const url = await bookingLink(id);
    if (!url) return new NextResponse("This fare is no longer available. Please search again.", { status: 404 });
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.warn("[ignav] booking link failed:", error instanceof Error ? error.message : error);
    return new NextResponse("We couldn't reach the booking partner. Please try again in a moment.", { status: 502 });
  }
}
