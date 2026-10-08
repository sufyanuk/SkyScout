import type { Metadata } from "next";
import { Price } from "@/components/common/price";
import Link from "next/link";
import { BellOff, BellRing, CheckCircle2, History, PauseCircle, Radar, Sparkles } from "lucide-react";
import { AlertActions } from "@/components/alerts/alert-actions";
import { AlertForm } from "@/components/alerts/alert-form";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth/session";
import { getAirport } from "@/lib/catalog/airports";
import { todayIso } from "@/lib/dates";
import { formatDate, formatRelative } from "@/lib/format";
import { alertRouteLabel, alertSearchHref, checkDueAlerts, listAlerts, type AlertWithEvents } from "@/lib/services/alerts";
import { DURATION_LABELS, FLEX_LABELS, isoFromDate } from "@/lib/services/mappers";
import { getHomeAirport } from "@/lib/services/preferences";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Price alerts",
  description: "Tell SkyScout your route and budget. We'll watch fares and flag the moment a flight drops below your target price.",
  alternates: { canonical: "/alerts" },
};

export default async function AlertsPage({ searchParams }: PageProps<"/alerts">) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const home = await getHomeAirport();
  const prefillFrom = getAirport(typeof sp.from === "string" ? sp.from : undefined)?.code ?? home;
  const prefillTo = getAirport(typeof sp.to === "string" ? sp.to : undefined)?.code ?? null;
  const prefillMax = Number(sp.max) > 0 ? Math.round(Number(sp.max)) : null;

  if (!user) return <AlertsLanding from={prefillFrom} to={prefillTo} max={prefillMax} />;

  let alerts: AlertWithEvents[] = [];
  let dbError = false;
  try {
    await checkDueAlerts(user.id);
    alerts = await listAlerts(user.id);
  } catch (error) {
    console.error("[alerts]", error);
    dbError = true;
  }
  const active = alerts.filter((a) => a.status === "ACTIVE" || a.status === "PAUSED");
  const triggered = alerts.filter((a) => a.status === "TRIGGERED");
  const history = alerts
    .flatMap((a) => a.events.map((e) => ({ ...e, route: alertRouteLabel(a) })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 40);

  return (
    <div className="container-page py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Price alerts</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">Let the fares come to you</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        We re-check active alerts every time you visit (and on a schedule in production) and flag them the moment a fare
        hits your target.
      </p>

      {dbError && (
        <p role="alert" className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          We couldn&apos;t load your alerts — the database may be unavailable. Please try again shortly.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
        <section aria-labelledby="new-alert" className="h-fit rounded-[2rem] border bg-card p-6 shadow-card lg:sticky lg:top-24">
          <h2 id="new-alert" className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <BellRing className="size-5 text-primary" aria-hidden="true" /> New alert
          </h2>
          <AlertForm today={todayIso()} initial={{ origin: prefillFrom, destination: prefillTo, maxPrice: prefillMax }} />
        </section>

        <section aria-label="Your alerts">
          <Tabs defaultValue={triggered.length > 0 ? "triggered" : "active"}>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="active" className="flex-1 sm:flex-none">
                Active <CountBadge n={active.length} />
              </TabsTrigger>
              <TabsTrigger value="triggered" className="flex-1 sm:flex-none">
                Triggered <CountBadge n={triggered.length} tone="sunrise" />
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 sm:flex-none">
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6 space-y-4">
              {active.length === 0 ? (
                <EmptyState icon={Radar} title="No active alerts" description="Create one with the form — try a route you'd fly if the price were right." />
              ) : (
                active.map((a) => <AlertCard key={a.id} alert={a} />)
              )}
            </TabsContent>
            <TabsContent value="triggered" className="mt-6 space-y-4">
              {triggered.length === 0 ? (
                <EmptyState icon={BellOff} title="Nothing triggered yet" description="When a fare drops below one of your targets it'll show up here." />
              ) : (
                triggered.map((a) => <AlertCard key={a.id} alert={a} />)
              )}
            </TabsContent>
            <TabsContent value="history" className="mt-6">
              {history.length === 0 ? (
                <EmptyState icon={History} title="No history yet" description="Alert activity — created, checked, triggered — is logged here." />
              ) : (
                <ol className="divide-y rounded-3xl border bg-card shadow-card">
                  {history.map((e) => (
                    <li key={e.id} className="flex gap-3 px-5 py-4">
                      <EventIcon type={e.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{e.route}</p>
                        <p className="text-sm text-muted-foreground">{e.message}</p>
                        {e.dealId && (
                          <Link href={`/deals/${e.dealId}`} className="text-sm font-medium text-primary hover:underline">
                            View fare
                          </Link>
                        )}
                      </div>
                      <time dateTime={e.createdAt.toISOString()} className="shrink-0 text-xs text-muted-foreground">
                        {formatRelative(e.createdAt)}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}

function CountBadge({ n, tone }: { n: number; tone?: "sunrise" }) {
  if (n === 0) return null;
  return (
    <span className={cn("rounded-full px-1.5 text-[11px]", tone === "sunrise" ? "bg-sunrise text-white" : "bg-foreground/10")}>{n}</span>
  );
}

function EventIcon({ type }: { type: string }) {
  const map: Record<string, { Icon: typeof BellRing; cls: string }> = {
    TRIGGERED: { Icon: Sparkles, cls: "bg-sunrise-soft text-sunrise" },
    CREATED: { Icon: BellRing, cls: "bg-accent text-primary" },
    PAUSED: { Icon: PauseCircle, cls: "bg-muted text-muted-foreground" },
    RESUMED: { Icon: CheckCircle2, cls: "bg-savings-soft text-savings" },
    DELETED: { Icon: BellOff, cls: "bg-muted text-muted-foreground" },
  };
  const { Icon, cls } = map[type] ?? map.CREATED;
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", cls)}>
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

function AlertCard({ alert }: { alert: AlertWithEvents }) {
  const label = alertRouteLabel(alert);
  const statusBadge =
    alert.status === "TRIGGERED" ? (
      <Badge variant="sunrise">Triggered</Badge>
    ) : alert.status === "PAUSED" ? (
      <Badge variant="secondary">Paused</Badge>
    ) : (
      <Badge variant="savings">Watching</Badge>
    );
  const criteria = [
    FLEX_LABELS[alert.dateFlexibility] + (alert.departureDate ? ` · ${formatDate(isoFromDate(alert.departureDate))}` : ""),
    DURATION_LABELS[alert.tripDuration],
    alert.maxStops === null ? "Any stops" : alert.maxStops === 0 ? "Direct only" : `Max ${alert.maxStops} stop`,
    alert.cabin.replace("_", " ").toLowerCase(),
  ];
  return (
    <article className={cn("rounded-3xl border bg-card p-5 shadow-card", alert.status === "TRIGGERED" && "border-sunrise/40 ring-4 ring-sunrise/10")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{label}</h3>
            {statusBadge}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Notify me below <strong className="text-foreground"><Price amount={alert.maxPrice} /></strong>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{alert.status === "TRIGGERED" ? "Matched at" : "Cheapest now"}</p>
          <p className={cn("text-2xl font-semibold tabular-nums", alert.status === "TRIGGERED" && "text-sunrise")}>
            {alert.status === "TRIGGERED" && alert.triggeredPrice !== null
              ? <Price amount={alert.triggeredPrice} />
              : alert.lastSeenPrice !== null
                ? <Price amount={alert.lastSeenPrice} />
                : "—"}
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {criteria.map((c) => (
          <li key={c} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
            {c}
          </li>
        ))}
      </ul>
      {alert.lastSeenPrice !== null && alert.status === "ACTIVE" && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (alert.maxPrice / alert.lastSeenPrice) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            <Price amount={Math.max(0, alert.lastSeenPrice - alert.maxPrice)} /> above your target
            {alert.lastCheckedAt && ` · checked ${formatRelative(alert.lastCheckedAt)}`}
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex flex-wrap gap-2">
          {alert.status === "TRIGGERED" && alert.triggeredDealId && (
            <Button asChild size="sm" variant="sunrise">
              <Link href={`/deals/${alert.triggeredDealId}`}>View the deal</Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={alertSearchHref(alert)}>See flights</Link>
          </Button>
        </div>
        <AlertActions alertId={alert.id} status={alert.status} label={label} />
      </div>
    </article>
  );
}

function AlertsLanding({ from, to, max }: { from: string; to: string | null; max: number | null }) {
  const callback = `/alerts?from=${from}${to ? `&to=${to}` : ""}${max ? `&max=${max}` : ""}`;
  const fromCity = getAirport(from)?.city;
  const examples = [
    { route: `${fromCity} → London`, target: 350, now: 412 },
    { route: `${fromCity} → Bangkok`, target: 300, now: 287, hit: true },
    { route: `${fromCity} → Anywhere`, target: 120, now: 134 },
  ];
  return (
    <div className="container-page py-12">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Price alerts</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Name your price. <span className="font-display font-normal italic text-primary">We&apos;ll watch.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Set a route, a budget and how flexible you are. SkyScout keeps checking and flags the moment a fare drops
            below your target.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/signup?callbackUrl=${encodeURIComponent(callback)}`}>Create a free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/login?callbackUrl=${encodeURIComponent(callback)}`}>Log in</Link>
            </Button>
          </div>
        </div>
        <ul className="space-y-4" aria-label="Example alerts">
          {examples.map((e) => (
            <li key={e.route} className={cn("rounded-3xl border bg-card p-5 shadow-card", e.hit && "border-sunrise/40 ring-4 ring-sunrise/10")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{e.route}</p>
                  <p className="text-sm text-muted-foreground">Notify me below <Price amount={e.target} /></p>
                </div>
                <div className="text-right">
                  {e.hit ? <Badge variant="sunrise">Triggered</Badge> : <Badge variant="savings">Watching</Badge>}
                  <p className={cn("mt-1 text-xl font-semibold tabular-nums", e.hit && "text-sunrise")}><Price amount={e.now} /></p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
