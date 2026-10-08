import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/api";
import { DESTINATIONS } from "@/lib/catalog/destinations";
import { getFlightProvider } from "@/lib/flights";
import { iataCode } from "@/lib/validation";

const querySchema = z.object({
  from: iataCode.optional(),
  tag: z.enum(["beach", "city", "culture", "nature", "food", "nightlife", "adventure"]).optional(),
});

/** GET /api/destinations?from=DOH&tag=beach — catalog plus cheapest fares when `from` is given. */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const { from, tag } = parsed.data;

  const quotes = from ? await getFlightProvider().exploreDestinations(from) : [];
  const prices = new Map(quotes.map((q) => [q.destination.code, q.cheapest]));
  const destinations = DESTINATIONS.filter((d) => (!tag || d.tags.includes(tag)) && d.airport !== from).map((d) => {
    const cheapest = prices.get(d.airport);
    return {
      slug: d.slug,
      city: d.city,
      country: d.country,
      airport: d.airport,
      tagline: d.tagline,
      tags: d.tags,
      bestMonths: d.bestMonths,
      url: `/destinations/${d.slug}`,
      cheapest: cheapest ? { price: cheapest.price, currency: cheapest.currency, dealId: cheapest.id } : null,
    };
  });
  return NextResponse.json({ from: from ?? null, destinations });
}
