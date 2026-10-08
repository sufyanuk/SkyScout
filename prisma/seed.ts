/**
 * Seeds reference data (airports, destinations), a snapshot of today's deals,
 * 90 days of price history for popular routes, and a demo account.
 *
 *   npm run db:seed
 */
import { PrismaClient, type CabinClass, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AIRPORTS } from "../src/lib/catalog/airports";
import { DESTINATIONS } from "../src/lib/catalog/destinations";
import { MockFlightProvider } from "../src/lib/flights/mock/mock-provider";
import type { FlightDeal } from "../src/lib/flights/types";

const db = new PrismaClient();
const provider = new MockFlightProvider();

const CABIN: Record<FlightDeal["cabin"], CabinClass> = {
  economy: "ECONOMY",
  premium: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
};
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

function dealRecord(deal: FlightDeal) {
  return {
    provider: deal.provider,
    originCode: deal.origin.code,
    destinationCode: deal.destination.code,
    departureDate: day(deal.departureDate),
    returnDate: deal.returnDate ? day(deal.returnDate) : null,
    airlineCode: deal.airline.code,
    airlineName: deal.airline.name,
    stops: deal.outbound.stops,
    durationMinutes: deal.outbound.durationMinutes,
    cabin: CABIN[deal.cabin],
    price: deal.price,
    typicalPrice: deal.typicalPrice,
    currency: deal.currency,
    data: deal as unknown as Prisma.InputJsonValue,
  };
}

async function main() {
  console.log("→ Airports");
  for (const a of AIRPORTS) {
    const data = {
      name: a.name,
      city: a.city,
      country: a.country,
      countryCode: a.countryCode,
      latitude: a.lat,
      longitude: a.lon,
      timezone: a.timezone,
      region: a.region,
    };
    await db.airport.upsert({ where: { code: a.code }, create: { code: a.code, ...data }, update: data });
  }

  console.log("→ Destinations");
  for (const d of DESTINATIONS) {
    const data = { city: d.city, country: d.country, airportCode: d.airport, summary: d.summary, tags: d.tags };
    await db.destination.upsert({ where: { slug: d.slug }, create: { slug: d.slug, ...data }, update: data });
  }

  console.log("→ Deal snapshots");
  const deals: FlightDeal[] = [];
  for (const origin of ["DOH", "DXB", "LHR"]) {
    for (const collection of ["best", "weekend", "long-haul"] as const) {
      deals.push(...(await provider.getDeals({ origin, collection, limit: 8 })));
    }
  }
  for (const deal of deals) {
    const data = dealRecord(deal);
    await db.flightDeal.upsert({ where: { id: deal.id }, create: { id: deal.id, ...data }, update: data });
  }

  console.log("→ Price history");
  const routes = ["BKK", "LHR", "IST", "MCT", "BOM", "TBS", "MLE", "CDG"].map((to) => ["DOH", to] as const);
  for (const [from, to] of routes) {
    const points = await provider.getPriceHistory(from, to, "economy", 90);
    await db.priceHistory.createMany({
      data: points.map((p) => ({ originCode: from, destinationCode: to, cabin: "ECONOMY" as const, observedOn: day(p.date), price: p.price })),
      skipDuplicates: true,
    });
  }

  console.log("→ Demo user (demo@skyscout.app / skyscout123)");
  const user = await db.user.upsert({
    where: { email: "demo@skyscout.app" },
    create: {
      email: "demo@skyscout.app",
      name: "Demo Traveller",
      homeAirport: "DOH",
      passwordHash: await bcrypt.hash("skyscout123", 12),
    },
    update: {},
  });
  for (const deal of deals.filter((d) => d.origin.code === "DOH").slice(0, 3)) {
    await db.favorite.upsert({
      where: { userId_dealId: { userId: user.id, dealId: deal.id } },
      create: { userId: user.id, dealId: deal.id },
      update: {},
    });
  }
  if ((await db.priceAlert.count({ where: { userId: user.id } })) === 0) {
    await db.priceAlert.create({
      data: {
        userId: user.id,
        originCode: "DOH",
        destinationCode: "LHR",
        maxPrice: 350,
        events: { create: { type: "CREATED", message: "Alert created: Doha → London under $350." } },
      },
    });
    await db.priceAlert.create({
      data: {
        userId: user.id,
        originCode: "DOH",
        destinationCode: "BKK",
        maxPrice: 300,
        tripDuration: "WEEK",
        events: { create: { type: "CREATED", message: "Alert created: Doha → Bangkok under $300." } },
      },
    });
  }

  console.log(`✓ Seeded ${AIRPORTS.length} airports, ${DESTINATIONS.length} destinations, ${deals.length} deals.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
