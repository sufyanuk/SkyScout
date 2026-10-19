import { NextResponse } from "next/server";
import { getAirport } from "@/lib/catalog/airports";
import { addDays, todayIso } from "@/lib/dates";
import { getFlightProvider } from "@/lib/flights";
import { ignavConfigured, searchFares, toDeal } from "@/lib/flights/ignav/ignav-provider";

export const dynamic = "force-dynamic";

/**
 * Connection check for the Ignav API (one billed request):
 *   GET /api/ignav/test?from=DOH&to=LHR
 * Reports whether the key works and shows a few sample fares. Never echoes
 * the key itself.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const from = (sp.get("from") ?? "DOH").toUpperCase();
  const to = (sp.get("to") ?? "LHR").toUpperCase();
  const base = { activeProvider: getFlightProvider().name, keyConfigured: ignavConfigured(), route: `${from}-${to}` };
  if (!getAirport(from) || !getAirport(to) || from === to) {
    return NextResponse.json({ ...base, ok: false, error: "Use two different airport codes from the SkyScout catalogue, e.g. ?from=DOH&to=LHR" }, { status: 400 });
  }
  if (!base.keyConfigured) {
    return NextResponse.json({ ...base, ok: false, error: "IGNAV_API_KEY is not set" }, { status: 503 });
  }

  const started = Date.now();
  const departure = addDays(todayIso(), 21);
  const returnDate = addDays(departure, 7);
  try {
    const itineraries = await searchFares({ origin: from, destination: to, departure, returnDate, cabin: "economy" });
    const deals = itineraries.map((i) => toDeal(i, "economy")).filter((d) => d !== null);
    return NextResponse.json({
      ...base,
      ok: true,
      latencyMs: Date.now() - started,
      dates: `${departure} → ${returnDate}`,
      faresReturned: itineraries.length,
      faresMapped: deals.length,
      samples: deals.slice(0, 5).map((d) => ({
        priceUsd: d.price,
        airline: d.airline.name,
        flights: d.outbound.segments.map((s) => s.flightNumber).join(", "),
        departure: d.outbound.departure,
        stops: d.outbound.stops,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { ...base, ok: false, latencyMs: Date.now() - started, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
