import Link from "next/link";
import type { Airport, DestinationQuote } from "@/lib/flights/types";
import { bearingDeg, distanceKm } from "@/lib/geo";
import { formatPrice } from "@/lib/format";

const SIZE = 600;
const C = SIZE / 2;
const R = 262;
const HOURS = [2, 4, 8, 12, 16];
const kmForHours = (h: number) => (h * 60 - 28) * 13.4;

/**
 * "Where can I go?" radar: destinations placed by true compass bearing and
 * flight time from the origin (azimuthal projection, square-root radius so
 * short hops don't pile up). Pure SVG + links — no client JavaScript.
 */
export function RouteRadar({
  origin,
  quotes,
  hrefFor,
}: {
  origin: Airport;
  quotes: DestinationQuote[];
  hrefFor: (q: DestinationQuote) => string;
}) {
  const maxKm = kmForHours(16);
  const radius = (km: number) => R * Math.sqrt(Math.min(km, maxKm) / maxKm);
  const highlighted = new Set(
    quotes.slice(0, 6).map((q) => q.destination.code),
  );
  const prices = quotes.map((q) => q.cheapest.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  const dots = quotes.map((q) => {
    const d = distanceKm(origin, q.destination);
    const angle = ((bearingDeg(origin, q.destination) - 90) * Math.PI) / 180;
    const r = radius(d);
    // Cheaper → stronger: single-hue sequential encoding of price.
    const t = maxP === minP ? 1 : 1 - (q.cheapest.price - minP) / (maxP - minP);
    return { q, x: C + r * Math.cos(angle), y: C + r * Math.sin(angle), t };
  });

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full"
      role="group"
      aria-label={`Map of destinations from ${origin.city}, by direction and flight time`}
    >
      <defs>
        <radialGradient id="radar-bg" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#eef2ff" />
          <stop offset="1" stopColor="#ffffff" />
        </radialGradient>
      </defs>
      <circle
        cx={C}
        cy={C}
        r={R + 18}
        fill="url(#radar-bg)"
        stroke="var(--border)"
      />
      {HOURS.map((h) => (
        <g key={h}>
          <circle
            cx={C}
            cy={C}
            r={radius(kmForHours(h))}
            fill="none"
            stroke="var(--border)"
            strokeDasharray={h === 16 ? undefined : "3 5"}
          />
          <text
            x={C + 6}
            y={C - radius(kmForHours(h)) + 14}
            fontSize="11"
            fill="var(--muted-foreground)"
          >
            {h}h
          </text>
        </g>
      ))}
      {[
        ["N", C, C - R - 4],
        ["E", C + R + 6, C + 4],
        ["S", C, C + R + 14],
        ["W", C - R - 6, C + 4],
      ].map(([label, x, y]) => (
        <text
          key={label as string}
          x={x as number}
          y={y as number}
          fontSize="11"
          fontWeight="700"
          fill="var(--muted-foreground)"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {dots.map(({ q, x, y }) => (
        <line
          key={`l-${q.destination.code}`}
          x1={C}
          y1={C}
          x2={x}
          y2={y}
          stroke="var(--primary)"
          strokeOpacity={highlighted.has(q.destination.code) ? 0.35 : 0.1}
          strokeDasharray="2 4"
        />
      ))}

      {dots.map(({ q, x, y, t }) => {
        const featured = highlighted.has(q.destination.code);
        const labelLeft = x > C + 120;
        return (
          <Link
            key={q.destination.code}
            href={hrefFor(q)}
            className="group outline-none"
          >
            <title>{`${q.destination.city}, ${q.destination.country} — from ${formatPrice(q.cheapest.price)}`}</title>
            <circle cx={x} cy={y} r="14" fill="transparent" />
            <circle
              cx={x}
              cy={y}
              r={featured ? 7 : 5.5}
              fill={featured ? "var(--sunrise)" : "var(--primary)"}
              fillOpacity={featured ? 1 : 0.35 + t * 0.65}
              stroke="var(--card)"
              strokeWidth="2"
              className="transition-all group-hover:stroke-foreground group-focus-visible:stroke-foreground"
            />
            {!featured && (
              <g
                className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                pointerEvents="none"
              >
                <text
                  x={labelLeft ? x - 11 : x + 11}
                  y={y + 4}
                  textAnchor={labelLeft ? "end" : "start"}
                  fontSize="12"
                  fontWeight="700"
                  fill="var(--foreground)"
                  stroke="var(--card)"
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  {q.destination.city} {formatPrice(q.cheapest.price)}
                </text>
              </g>
            )}
          </Link>
        );
      })}

      {/* Always-on labels for the cheapest few, drawn last so dots never cover them; skip any that would collide. */}
      <g pointerEvents="none" aria-hidden="true">
        {placeLabels(
          dots.filter((d) => highlighted.has(d.q.destination.code)),
        ).map(({ q, x, y, left }) => (
          <text
            key={`label-${q.destination.code}`}
            x={left ? x - 11 : x + 11}
            y={y + 4}
            textAnchor={left ? "end" : "start"}
            fontSize="12"
            fontWeight="700"
            fill="var(--foreground)"
            stroke="var(--card)"
            strokeWidth="4"
            paintOrder="stroke"
          >
            {q.destination.city} {formatPrice(q.cheapest.price)}
          </text>
        ))}
      </g>

      <circle
        cx={C}
        cy={C}
        r="9"
        fill="var(--foreground)"
        stroke="var(--card)"
        strokeWidth="3"
      />
      <text
        x={C}
        y={C + 26}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="var(--foreground)"
        stroke="var(--card)"
        strokeWidth="4"
        paintOrder="stroke"
      >
        {origin.city}
      </text>
    </svg>
  );
}

interface PlacedDot {
  q: DestinationQuote;
  x: number;
  y: number;
}

/** Greedy label placement: try right then left of each dot, drop labels that would overlap. */
function placeLabels(dots: PlacedDot[]) {
  const boxes: { x1: number; x2: number; y1: number; y2: number }[] = [
    { x1: C - 40, x2: C + 40, y1: C - 10, y2: C + 32 },
  ];
  const placed: (PlacedDot & { left: boolean })[] = [];
  for (const dot of dots) {
    const width = (dot.q.destination.city.length + 6) * 7.2;
    for (const left of [dot.x > C + 120, dot.x <= C + 120]) {
      const x1 = left ? dot.x - 11 - width : dot.x + 11;
      const box = { x1, x2: x1 + width, y1: dot.y - 9, y2: dot.y + 9 };
      const hit = boxes.some(
        (b) => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1,
      );
      if (!hit) {
        boxes.push(box);
        placed.push({ ...dot, left });
        break;
      }
    }
  }
  return placed;
}
