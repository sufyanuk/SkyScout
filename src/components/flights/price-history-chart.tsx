"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useCurrency } from "@/components/common/currency-provider";
import type { PricePoint } from "@/lib/flights/types";
import { formatDate } from "@/lib/format";

interface PriceHistoryChartProps {
  points: PricePoint[];
  typicalPrice: number;
  dealPrice: number;
  title?: string;
}

const W = 640;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

/**
 * Lowest observed return fare per day for a route. One series, so no legend:
 * the two reference lines (typical price, this deal) are labelled directly.
 */
export function PriceHistoryChart({ points, typicalPrice, dealPrice, title = "Price history" }: PriceHistoryChartProps) {
  const { format } = useCurrency();
  const gradientId = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const prices = [...points.map((p) => p.price), typicalPrice, dealPrice];
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const step = niceStep((rawMax - rawMin) / 4);
    const min = Math.floor((rawMin * 0.95) / step) * step;
    const max = Math.ceil((rawMax * 1.03) / step) * step;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
    const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH;
    const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join("");
    const area = `${line}L${x(points.length - 1)},${PAD.top + innerH}L${PAD.left},${PAD.top + innerH}Z`;
    const ticks: number[] = [];
    for (let v = min; v <= max + 0.5; v += step) ticks.push(v);
    const lowIndex = points.reduce((best, p, i) => (p.price < points[best].price ? i : best), 0);
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (points.length - 1)));
    return { x, y, line, area, ticks, lowIndex, xTicks, innerH };
  }, [points, typicalPrice, dealPrice]);

  if (!geometry) {
    return <p className="text-sm text-muted-foreground">Not enough price history for this route yet.</p>;
  }
  const { x, y, line, area, ticks, lowIndex, xTicks } = geometry;
  const average = Math.round(points.reduce((s, p) => s + p.price, 0) / points.length);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (px - PAD.left) / (W - PAD.left - PAD.right);
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))));
  }

  function onKey(e: React.KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? points.length) - 1));
    if (e.key === "ArrowRight") setHover((h) => Math.min(points.length - 1, (h ?? -1) + 1));
    if (e.key === "Escape") setHover(null);
  }

  const hovered = hover !== null ? points[hover] : null;

  return (
    <figure className="space-y-3">
      <figcaption className="sr-only">
        {title}: lowest fares over the last {points.length} days ranged from {format(points[lowIndex].price)} to{" "}
        {format(Math.max(...points.map((p) => p.price)))}, averaging {format(average)}. This deal is {format(dealPrice)}.
      </figcaption>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-pan-y select-none focus-visible:outline-none"
          role="img"
          aria-label={`${title} chart. Use left and right arrow keys to read daily prices.`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.16" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
                {format(t)}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--muted-foreground)">
              {formatDate(points[i].date)}
            </text>
          ))}

          <path d={area} fill={`url(#${gradientId})`} />

          {/* Reference lines, labelled directly */}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(typicalPrice)} y2={y(typicalPrice)} stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7" />
          <text x={W - PAD.right} y={y(typicalPrice) - 6} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--muted-foreground)">
            Typical {format(typicalPrice)}
          </text>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(dealPrice)} y2={y(dealPrice)} stroke="var(--sunrise)" strokeWidth="1.5" strokeDasharray="2 4" strokeLinecap="round" />
          <text x={W - PAD.right} y={y(dealPrice) + 15} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--foreground)">
            This deal {format(dealPrice)}
          </text>

          <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={x(lowIndex)} cy={y(points[lowIndex].price)} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />

          {hovered && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--foreground)" strokeOpacity="0.25" />
              <circle cx={x(hover)} cy={y(hovered.price)} r="5" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
            </g>
          )}
        </svg>

        {hovered && hover !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 rounded-xl border bg-popover px-3 py-2 text-xs shadow-lift"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${hover > points.length / 2 ? "calc(-100% - 10px)" : "10px"})`,
            }}
          >
            <p className="text-muted-foreground">{formatDate(hovered.date)}</p>
            <p className="text-sm font-semibold tabular-nums">{format(hovered.price)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Lowest seen </span>
          <span className="font-semibold tabular-nums">{format(points[lowIndex].price)}</span>
          <span className="text-muted-foreground"> on {formatDate(points[lowIndex].date)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">{points.length}-day average </span>
          <span className="font-semibold tabular-nums">{format(average)}</span>
        </p>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer rounded-md font-medium text-primary">View as table</summary>
        <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Date</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Lowest fare</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.date} className="border-t">
                  <td className="px-3 py-1.5">{formatDate(p.date)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{format(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function niceStep(raw: number): number {
  const pow = 10 ** Math.floor(Math.log10(Math.max(1, raw)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
