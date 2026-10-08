import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/api";
import { DEFAULT_ORIGIN } from "@/lib/catalog/airports";
import { getFlightProvider } from "@/lib/flights";
import { CABINS } from "@/lib/flights/types";
import { iataCode } from "@/lib/validation";

const querySchema = z.object({
  origin: iataCode.default(DEFAULT_ORIGIN),
  collection: z.enum(["best", "cheapest", "weekend", "long-haul", "under-300", "direct"]).default("best"),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  cabin: z.enum(CABINS).default("economy"),
});

/** GET /api/deals?origin=DOH&collection=weekend&limit=6 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const deals = await getFlightProvider().getDeals(parsed.data);
  return NextResponse.json({ ...parsed.data, deals });
}
