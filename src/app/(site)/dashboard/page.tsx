import type { Metadata } from "next";
import { formatMoney } from "@/lib/currency";
import { getCurrency } from "@/lib/services/preferences";
import { Price } from "@/components/common/price";
import Link from "next/link";
import { ArrowRight, BellRing, Heart, History, Search, Sparkles } from "lucide-react";
import { ProfileForm } from "@/components/account/profile-form";
import { EmptyState } from "@/components/common/empty-state";
import { DealCard } from "@/components/flights/deal-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getAirport } from "@/lib/catalog/airports";
import { locationLabel } from "@/lib/catalog/locations";
import { db } from "@/lib/db";
import { formatDateRange, formatRelative } from "@/lib/format";
import { alertRouteLabel, listAlerts } from "@/lib/services/alerts";
import { listFavorites } from "@/lib/services/favorites";
import { isoFromDate } from "@/lib/services/mappers";
import { listSearches } from "@/lib/services/searches";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const currency = await getCurrency();
  const money = (usd: number) => formatMoney(usd, currency);
  const sessionUser = await requireUser("/dashboard");
  const [user, favorites, alerts, searches] = await Promise.all([
    db.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true, homeAirport: true, createdAt: true } }),
    listFavorites(sessionUser.id),
    listAlerts(sessionUser.id),
    listSearches(sessionUser.id, 15),
  ]);
  const liveAlerts = alerts.filter((a) => a.status !== "DELETED");
  const triggered = liveAlerts.filter((a) => a.status === "TRIGGERED");

  const stats = [
    { label: "Saved flights", value: favorites.length, href: "/favorites", icon: Heart },
    { label: "Active alerts", value: liveAlerts.filter((a) => a.status === "ACTIVE").length, href: "/alerts", icon: BellRing },
    { label: "Triggered", value: triggered.length, href: "/alerts", icon: Sparkles },
    { label: "Searches", value: searches.length, href: "#history", icon: History },
  ];

  return (
    <div className="container-page py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Dashboard</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">Hi {user?.name?.split(" ")[0] ?? "there"} 👋</h1>
      <p className="mt-2 text-muted-foreground">
        Flying from {getAirport(user?.homeAirport)?.city ?? "your home airport"}
        {user && ` · member since ${user.createdAt.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-3xl border bg-card p-5 shadow-card transition hover:shadow-lift">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4 text-primary" aria-hidden="true" /> {label}
            </dt>
            <dd className="mt-2 text-3xl font-semibold tabular-nums">{value}</dd>
          </Link>
        ))}
      </dl>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="saved">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="saved" className="text-xl font-semibold">
                Saved flights
              </h2>
              <Link href="/favorites" className="text-sm font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            {favorites.length === 0 ? (
              <EmptyState icon={Heart} title="Nothing saved yet" description="Tap the heart on any deal to save it." action={<Button asChild><Link href="/deals">Browse deals</Link></Button>} />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {favorites.slice(0, 4).map((f) => (
                  <DealCard key={f.favoriteId} deal={f.deal} refreshOnFavoriteChange />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="history-title" id="history" className="scroll-mt-24">
            <h2 id="history-title" className="mb-4 text-xl font-semibold">
              Search history
            </h2>
            {searches.length === 0 ? (
              <EmptyState icon={Search} title="No searches yet" description="Your recent searches appear here so you can re-run them in one tap." />
            ) : (
              <ul className="divide-y rounded-3xl border bg-card shadow-card">
                {searches.map((s) => (
                  <li key={s.id}>
                    <Link href={s.query} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-muted/50">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <Search className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {locationLabel(s.originCode)} → {locationLabel(s.destination)}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {s.departureDate ? formatDateRange(isoFromDate(s.departureDate), s.returnDate ? isoFromDate(s.returnDate) : null) : "Flexible dates"} ·{" "}
                          {s.resultCount} results{s.cheapestPrice ? ` from ${money(s.cheapestPrice)}` : ""}
                        </span>
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:block">{formatRelative(s.createdAt)}</span>
                      <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="alerts-summary" className="rounded-3xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 id="alerts-summary" className="font-semibold">
                Price alerts
              </h2>
              <Link href="/alerts" className="text-sm font-semibold text-primary hover:underline">
                Manage
              </Link>
            </div>
            {liveAlerts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No alerts yet.{" "}
                <Link href="/alerts" className="font-medium text-primary hover:underline">
                  Create your first one
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {liveAlerts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{alertRouteLabel(a)}</span>
                      <span className="text-xs text-muted-foreground">below <Price amount={a.maxPrice} /></span>
                    </span>
                    <span className={a.status === "TRIGGERED" ? "font-semibold text-sunrise" : "text-muted-foreground"}>
                      {a.status === "TRIGGERED" ? `Hit ${money(a.triggeredPrice ?? 0)}` : a.status === "PAUSED" ? "Paused" : a.lastSeenPrice ? money(a.lastSeenPrice) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="profile" className="rounded-3xl border bg-card p-6 shadow-card">
            <h2 id="profile" className="mb-4 font-semibold">
              Profile
            </h2>
            <ProfileForm name={user?.name ?? ""} email={user?.email ?? sessionUser.email ?? ""} homeAirport={user?.homeAirport ?? "DOH"} />
          </section>
        </div>
      </div>
    </div>
  );
}
