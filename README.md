# SkyScout ✈️

**Find flights worth flying for.** SkyScout is a flight-deal discovery app: it scans fares from your airport, compares every price against what the route usually costs, and surfaces the unusually cheap ones, along with destinations you might never have thought to search.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Lucide, PostgreSQL + Prisma, Auth.js and Zod.

> The app runs fully offline on a **realistic mock flight provider**: deterministic fares, schedules, baggage and price history across 33 airports and 29 airlines. A real flight API can be plugged in behind the same interface (see [Connecting a real flight API](#connecting-a-real-flight-api)).

---

## Features

| Area | What's there |
| --- | --- |
| **Homepage** | Hero search, flexible quick searches (Anywhere, This weekend, Next month, Under $300, Direct only), Best deals right now, Cheap flights from your airport, Trending destinations, Weekend escapes, Long-haul bargains |
| **Search** (`/flights`) | URL-driven state (shareable links), sidebar filters on desktop and a bottom-sheet drawer on mobile: price presets/custom, stops, exact/flexible dates, trip length (weekend, 3–5 days, 1 week, 2 weeks, custom), airlines, departure and arrival time, cabin. Sort by Best / Cheapest / Fastest / Best value; list or grid view; "load more" |
| **Explore** (`/explore`) | Every destination from an origin, sorted by price, plus a zero-JS SVG "route radar" (compass bearing × flight time). Filters for when, budget and direct only |
| **Deals** (`/deals`) | Collections: biggest drops, cheapest, weekend, under $300, direct, long-haul |
| **Deal page** (`/deals/[id]`) | Segment timeline, layovers, baggage and fare rules, interactive price-history chart (keyboard and table accessible), similar flights, save/share, price-alert shortcut, "Search this flight" CTA |
| **Destinations** (`/destinations/[slug]`) | Hero, cheapest flights, average price, fastest flight, best time to visit, popular airlines, example itineraries, travel info, JSON-LD |
| **Auth** | Sign up, log in, log out (Auth.js credentials; Google/GitHub switch on automatically when their keys are set) |
| **Favourites** (`/favorites`) | Save deals; live re-pricing with "▼ $24 since you saved it" |
| **Price alerts** (`/alerts`) | Origin, destination or anywhere, max price, date flexibility, trip length, stops, cabin. Active / Triggered / History tabs, check now, pause/re-arm, delete |
| **Dashboard** (`/dashboard`) | Profile and home airport, saved flights, alerts summary, search history (one-tap re-run) |
| **SEO** | Dynamic metadata, canonical URLs, Open Graph images (site and per destination), `sitemap.xml`, `robots.txt`, JSON-LD (WebSite + SearchAction, TouristDestination, BreadcrumbList, Flight) |
| **UX** | Skeleton loading states, empty and error states, toasts, mobile bottom navigation, skip link, focus rings, ARIA combobox airport picker, reduced-motion support |

---

## Quick start (local development)

**Requirements:** Node.js 20.9+ (22 recommended) and PostgreSQL 14+.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Configure environment
cp .env.example .env
#    then set DATABASE_URL and AUTH_SECRET (generate one with: npx auth secret)

# 3. Create the database schema and seed it
npm run setup          # applies migrations + seeds (scripts/db-deploy.mjs)

# 4. Run the dev server
npm run dev            # http://localhost:3000
```

**Demo account** (created by the seed): `demo@skyscout.app` / `skyscout123`, with saved flights and two price alerts.

### Getting a PostgreSQL database

Any of these work. Put the connection string in `DATABASE_URL`.

```bash
# Docker
docker run --name skyscout-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=skyscout -p 5432:5432 -d postgres:16

# Homebrew (macOS)
brew install postgresql@16 && brew services start postgresql@16 && createdb skyscout
```

Hosted options: Neon, Supabase, Prisma Postgres, or Vercel Marketplace Postgres.

> Browsing (search, explore, deals, destinations) works even if the database is down, because flight data comes from the provider. Accounts, favourites, alerts and history need the database.

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run db:migrate` | Create and apply a new migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Seed airports, destinations, deal snapshots, price history and the demo user |
| `npm run db:reset` | Drop, re-migrate and re-seed (destructive) |
| `npm run db:studio` | Browse data in Prisma Studio |

---

## Project structure

```
prisma/
  schema.prisma          User, Account, Session, Airport, Destination, FlightDeal,
                         Favorite, PriceAlert, AlertEvent, Search, PriceHistory
  migrations/            SQL migrations
  seed.ts
src/
  auth.ts                Auth.js config (credentials + optional OAuth, Prisma adapter, JWT sessions)
  proxy.ts               Optimistic redirect for /dashboard and /favorites (Next 16 "proxy")
  actions/               Server actions: auth, profile, preferences, alert pause/check
  app/
    (site)/              All pages share the header, footer and mobile nav
      page.tsx           Homepage
      flights/           Search results (+ loading skeleton)
      explore/  deals/  deals/[id]/  destinations/  destinations/[slug]/
      alerts/  favorites/  dashboard/  login/  signup/
    api/                 REST endpoints (see below)
    sitemap.ts robots.ts opengraph-image.tsx not-found.tsx global-error.tsx
  components/
    ui/                  shadcn/ui primitives (button, dialog, sheet, select, …)
    layout/              Header, NavLinks, UserMenu, MobileNavigation, Footer, Logo
    search/              SearchBox, AirportSelector, DateSelector, TravelerSelector
    results/             FilterPanel, FilterSidebar, FilterDrawer, SortDropdown, ViewToggle
    flights/             DealCard, FlightCard, FlightTimeline, PriceHistoryChart,
                         FavoriteButton, ShareButton, BookDialog, badges (Price/Savings/Rating)
    explore/  destinations/  alerts/  auth/  account/  common/ (EmptyState, LoadingSkeleton…)
  lib/
    flights/             ← the flight-data layer
      types.ts           Provider-agnostic domain types
      provider.ts        FlightSearchProvider interface
      index.ts           getFlightProvider() factory
      filtering.ts       Shared filter/sort/facet logic
      mock/              MockFlightProvider + deterministic generator
      real-provider.ts   RealFlightProvider placeholder
    catalog/             Airports, airlines, destination guides (static reference data)
    services/            Favourites, alerts, searches/price history, notifications
    search-params.ts     URL ⇄ search state (Zod)
    validation.ts        Zod schemas for forms and APIs
```

---

## Flight data architecture

```
FlightSearchProvider (src/lib/flights/provider.ts)
├── MockFlightProvider   (default, no credentials)
└── RealFlightProvider   (placeholder for Amadeus / Duffel / Kiwi / …)
```

Everything in the UI and API goes through `getFlightProvider()`, which returns an object implementing:

```ts
searchFlights(params, { filters, sort })   // itineraries + facets
getDeal(id)                                // one itinerary by provider-issued id
getDeals({ origin, collection, limit })    // curated feeds
exploreDestinations(origin, options)       // cheapest fare per destination
getPriceHistory(origin, destination)       // daily lowest fares
getSimilarDeals(deal)
```

**How the mock works:** a deal id such as `DOH-BKK-20261112-20261119-TG-1E` encodes the route, dates, airline, variant and cabin. The generator seeds a PRNG from that id to produce the same schedule, price, baggage and fare rules every time, so detail pages, favourites and alerts stay consistent without storing anything. Prices come from great-circle distance, region, seasonality, cabin, airline positioning, stops and booking lead time. Routings come from real hub structures: direct where an airline hubs at either end, one-stop via the carrier's hub, and occasional cheaper two-stop options on long-haul routes.

### Connecting a real flight API

1. Implement the methods in `src/lib/flights/real-provider.ts`, mapping the API's offers into the types in `src/lib/flights/types.ts`. Prices are per traveller; times are local wall-clock strings. Supply `typicalPrice` so savings can be computed, for example from `PriceHistory`.
2. Add `FLIGHT_API_BASE_URL`, `FLIGHT_API_KEY` and `FLIGHT_API_SECRET` to the environment. These are read only on the server and never sent to the browser.
3. Set `FLIGHT_PROVIDER=live`.
4. Recommended: cache searches (rate limits), issue stable deal ids so saved favourites can be re-fetched, and keep using `recordPriceObservations` (already called after each search) to build up real price history.

Filtering, sorting and facets in `filtering.ts` are provider-agnostic, so they can be reused for anything the API can't filter server-side.

---

## API

All inputs are validated with Zod; errors return `{ error, fields? }` with a 4xx status.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/flights` | Same query as `/flights` (`from` required; `to`, `departure`, `return`, `when`, `trip`, `adults`, `children`, `cabin`, `length`, `maxPrice`, `stops`, `airlines`, `dep`, `arr`, `sort`, `limit`) |
| GET | `/api/flights/[id]` | One deal |
| GET | `/api/destinations` | `?from=DOH&tag=beach`: catalog plus cheapest fares |
| GET | `/api/deals` | `?origin=DOH&collection=best\|cheapest\|weekend\|long-haul\|under-300\|direct&limit=12` |
| GET | `/api/alerts` | Auth required |
| POST | `/api/alerts` | Auth required. `{ origin, destination \| "ANYWHERE", maxPrice, dateFlexibility, departureDate?, tripDuration, maxStops?, cabin }` |
| DELETE | `/api/alerts/[id]` | Soft delete (kept in history) |
| GET/POST | `/api/favorites` | POST `{ dealId }` |
| DELETE | `/api/favorites/[dealId]` | Remove a saved deal |
| GET | `/api/cron/alerts` | Scheduled alert checker; requires `Authorization: Bearer $CRON_SECRET` |

Example: `curl "localhost:3000/api/flights?from=DOH&to=BKK&departure=2026-11-12&return=2026-11-19&stops=0&sort=cheapest"`

### Price alerts

Alerts are re-checked when their owner opens `/alerts` (at most every 30 minutes), on **Check now**, and by the cron endpoint. When the cheapest matching fare is at or below the target, the alert moves to *Triggered*, the event is logged, and `NotificationService` (`src/lib/services/notifications.ts`) is called. Delivery currently logs to the console; plug in Resend, Postmark or SES there.

---

## Production deployment

### Vercel (recommended)

1. Push the repository and import it in Vercel.
2. Add a Postgres database (Vercel Marketplace: Neon, Supabase or Prisma Postgres) and set `DATABASE_URL`.
3. Set `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL` (your domain) and optionally `CRON_SECRET` and OAuth keys.
4. The `vercel-build` script runs `scripts/db-deploy.mjs` (`prisma migrate deploy`, then an idempotent seed), then builds.
   > **Use a dedicated, empty database for SkyScout.** If `DATABASE_URL` points at a database that already has
   > other tables (for example another app's database), Prisma stops with **P3005** and nothing is changed.
   > Production builds then fail with an explanation. Preview builds continue without database setup, so you can
   > still review the UI with mock flight data, but accounts, favourites and alerts won't work until the database is fixed.
5. Optional, for scheduled alerts: add a cron in `vercel.json`. Vercel Cron sends the `CRON_SECRET` bearer automatically.
   ```json
   { "crons": [{ "path": "/api/cron/alerts", "schedule": "0 * * * *" }] }
   ```

### Any Node host or Docker

```bash
npm ci
node scripts/db-deploy.mjs                        # migrations + idempotent seed
npm run build
NODE_ENV=production npm start                      # PORT defaults to 3000
```

Behind a proxy, Auth.js trusts the forwarded host (`trustHost: true`). Set `NEXT_PUBLIC_SITE_URL` so canonical URLs and the sitemap use your public domain. The login rate limiter is in-memory, so use a shared store (for example Redis) if you run several instances.

### Environment variables

See [`.env.example`](.env.example). Required: `DATABASE_URL`, `AUTH_SECRET`. Recommended: `NEXT_PUBLIC_SITE_URL`. Optional: `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, `FLIGHT_PROVIDER`, `FLIGHT_API_*`, `CRON_SECRET`.

---

## Design notes

- An original visual identity: "night flight" ink, scout blue for actions, sunrise coral for deal highlights and green for savings. Type is Geist with Instrument Serif italic accents.
- Destination artwork consists of generated SVG illustrations (gradient sky plus a skyline, mountain, island, desert or old-town motif), so there are no stock photos or third-party assets. Add photography later via the destination catalog.
- Airlines appear as neutral monograms, never logos.
- Server Components by default. Client JavaScript is limited to interactive islands such as the search box, filters, favourite and share buttons, dialogs and the chart. The explore radar is pure SVG with links.

## Disclaimer

Prices shown with the mock provider are sample data for demonstration only. They are not live airline inventory, and the booking CTA explains this instead of linking to a fake checkout.
