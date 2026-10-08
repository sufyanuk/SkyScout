import { diffDays } from "@/lib/dates";
import type { FlightDeal, IsoDate, PricePoint } from "@/lib/flights/types";

export type ForecastVerdict = "buy" | "wait" | "watch";

export interface FareForecast {
  verdict: ForecastVerdict;
  /** 50–97: how sure the model is. */
  confidence: number;
  headline: string;
  reasons: string[];
  /** Expected price move over the next ~2 weeks, USD (negative = cheaper). */
  expectedChange: number;
  /** Share of fares seen on this route in the history window that cost more. */
  cheaperThanPercent: number | null;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Least-squares slope of the last `n` points, as a fraction of the mean per day. */
function relativeTrend(points: PricePoint[], n = 14): number {
  const recent = points.slice(-n);
  if (recent.length < 4) return 0;
  const mean = recent.reduce((s, p) => s + p.price, 0) / recent.length;
  const xm = (recent.length - 1) / 2;
  let num = 0;
  let den = 0;
  recent.forEach((p, i) => {
    num += (i - xm) * (p.price - mean);
    den += (i - xm) ** 2;
  });
  return den === 0 || mean === 0 ? 0 : num / den / mean;
}

/**
 * "Buy or wait?" — a transparent heuristic over the route's price history,
 * how this fare compares with the typical price, and days until departure.
 * Deterministic and explainable: every verdict comes with its reasons.
 */
export function forecastFare(
  deal: Pick<FlightDeal, "price" | "typicalPrice" | "departureDate" | "returnDate">,
  history: PricePoint[],
  today: IsoDate,
): FareForecast {
  const ratio = deal.price / deal.typicalPrice;
  const days = diffDays(today, deal.departureDate);
  const trend = relativeTrend(history);
  const comparable = deal.returnDate !== null && history.length > 10;
  const cheaperThan = comparable
    ? Math.round((history.filter((p) => p.price > deal.price).length / history.length) * 100)
    : null;
  const belowTypical = Math.round((1 - ratio) * 100);
  const trendPct = Math.round(trend * 14 * 100);
  const reasons: string[] = [];

  if (belowTypical > 0) reasons.push(`${belowTypical}% below the typical fare for these dates.`);
  else if (belowTypical < -3) reasons.push(`${-belowTypical}% above the typical fare for these dates.`);
  if (cheaperThan !== null) reasons.push(`Cheaper than ${cheaperThan}% of fares seen on this route in the last ${history.length} days.`);
  if (Math.abs(trendPct) >= 3) {
    reasons.push(`Fares on this route have ${trendPct < 0 ? "fallen" : "risen"} about ${Math.abs(trendPct)}% over the last two weeks.`);
  }
  reasons.push(
    days <= 21
      ? `Departure is ${days} days away — prices usually climb in the final three weeks.`
      : `${days} days to departure; the sweet spot for this distance is usually 3–8 weeks out.`,
  );

  // 1. Genuinely rare fare → buy.
  if (ratio <= 0.8 || (cheaperThan !== null && cheaperThan >= 90)) {
    const confidence = clamp(Math.round(62 + belowTypical * 0.7 + ((cheaperThan ?? 50) - 50) * 0.3), 60, 97);
    return {
      verdict: "buy",
      confidence,
      headline: "Buy now — this is an unusually low fare",
      reasons,
      // Rare fares revert towards typical; assume about a third of the gap returns.
      expectedChange: Math.round(Math.max(15, (deal.typicalPrice - deal.price) * 0.35)),
      cheaperThanPercent: cheaperThan,
    };
  }
  // 2. Close to departure → prices only go up.
  if (days <= 21) {
    return {
      verdict: "buy",
      confidence: clamp(Math.round(70 + (21 - days) * 1.2), 70, 92),
      headline: "Buy soon — fares tend to rise from here",
      reasons,
      expectedChange: Math.round(deal.price * 0.08),
      cheaperThanPercent: cheaperThan,
    };
  }
  // 3. Falling market or above typical with time to spare → wait.
  if ((trend < -0.003 && days > 35) || (ratio >= 1.05 && days > 30)) {
    const drop = Math.round(deal.price * clamp(Math.max(-trend * 14, ratio - 1), 0.03, 0.18));
    return {
      verdict: "wait",
      confidence: clamp(Math.round(55 + Math.max(-trendPct, (ratio - 1) * 100) * 1.5), 55, 85),
      headline: "Wait — this fare is likely to drop",
      reasons,
      expectedChange: -drop,
      cheaperThanPercent: cheaperThan,
    };
  }
  return {
    verdict: "watch",
    confidence: clamp(Math.round(55 + Math.abs(belowTypical) * 0.5), 52, 75),
    headline: "Fair price — set an alert and watch",
    reasons,
    expectedChange: Math.round(deal.price * trend * 14),
    cheaperThanPercent: cheaperThan,
  };
}
