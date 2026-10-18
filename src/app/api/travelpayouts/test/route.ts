import { NextResponse } from "next/server";
import { getAirport } from "@/lib/catalog/airports";
import { addDays, todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import { fetchTickets, toDeals, travelpayoutsConfigured } from "@/lib/flights/travelpayouts/travelpayouts-provider";

export const dynamic = "force-dynamic";

/**
 * Connection check for the Travelpayouts Data API:
 *   GET /api/travelpayouts/test?from=DOH&to=BKK
 * Reports whether the token works and shows a few sample fares. Never echoes
 * the token itself.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const from = (sp.get("from") ?? "DOH").toUpperCase();
  const to = (sp.get("to") ?? "BKK").toUpperCase();
  const base = {
    activeProvider: getFlightProvider().name,
    tokenConfigured: travelpayoutsConfigured(),
    markerConfigured: Boolean(process.env.TRAVELPAYOUTS_MARKER),
    route: `${from}-${to}`,
  };
  if (!getAirport(from) || !getAirport(to) || from === to) {
    return NextResponse.json({ ...base, ok: false, error: "Use two different airport codes from the SkyScout catalogue, e.g. ?from=DOH&to=BKK" }, { status: 400 });
  }
  if (!base.tokenConfigured) {
    return NextResponse.json({ ...base, ok: false, error: "TRAVELPAYOUTS_TOKEN is not set" }, { status: 503 });
  }

  const started = Date.now();
  try {
    const month = addDays(todayIso(), 14).slice(0, 7);
    const tickets = await fetchTickets({ origin: from, destination: to, departureAt: month, oneWay: false, limit: 30 });
    const deals = toDeals(tickets);
    return NextResponse.json({
      ...base,
      ok: true,
      latencyMs: Date.now() - started,
      month,
      faresReturned: tickets.length,
      faresMapped: deals.length,
      samples: deals.slice(0, 5).map((d) => ({
        id: d.id,
        priceUsd: d.price,
        airline: d.airline.name,
        departure: d.outbound.departure,
        returnDate: d.returnDate,
        stops: d.outbound.stops,
        bookingUrl: d.bookingUrl ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ...base, ok: false, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
