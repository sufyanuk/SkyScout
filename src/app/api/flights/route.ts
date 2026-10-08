import { NextResponse, type NextRequest } from "next/server";
import { validationError } from "@/lib/api";
import { getFlightProvider } from "@/lib/flights";
import { flightsQuerySchema, rawToQueryInput, searchParamsToRecord, toParsedSearch } from "@/lib/search-params";

/**
 * GET /api/flights?from=DOH&to=BKK&departure=2026-11-12&return=2026-11-19
 * Same parameters as the /flights page (stops, airlines, maxPrice, sort, limit…).
 */
export async function GET(request: NextRequest) {
  const parsed = flightsQuerySchema.safeParse(rawToQueryInput(searchParamsToRecord(request.nextUrl.searchParams)));
  if (!parsed.success) return validationError(parsed.error);

  const search = toParsedSearch(parsed.data);
  const result = await getFlightProvider().searchFlights(search.params, { filters: search.filters, sort: search.sort });
  return NextResponse.json({
    params: search.params,
    filters: search.filters,
    sort: search.sort,
    total: result.deals.length,
    deals: result.deals.slice(0, search.limit),
    facets: result.facets,
  });
}
