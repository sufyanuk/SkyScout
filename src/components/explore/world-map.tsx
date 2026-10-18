import Link from "next/link";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import land110m from "world-atlas/land-110m.json";
import type { Airport, DestinationQuote } from "@/lib/flights/types";

const W = 960;
const H = 520;
const PAD = 36;

// Land outlines (Natural Earth 110m), converted once per server instance.
const topo = land110m as unknown as Topology<{ land: GeometryCollection }>;
const LAND = feature(topo, topo.objects.land);

/**
 * World map of destinations from an origin: great-circle routes, dots
 * coloured by price, labels for the cheapest few. The view zooms to fit the
 * destinations. Rendered on the server as plain SVG + links.
 */
export function WorldMap({
  origin,
  quotes,
  hrefFor,
  money,
}: {
  origin: Airport;
  quotes: DestinationQuote[];
  hrefFor: (q: DestinationQuote) => string;
  /** Formats a USD amount in the visitor's currency (SVG text needs plain strings). */
  money: (usd: number) => string;
}) {
  // Fit the projection to the origin and all destinations, with a minimum
  // span so a handful of nearby cities don't zoom in absurdly far.
  const points: [number, number][] = [
    [origin.lon, origin.lat],
    [origin.lon - 18, origin.lat - 12],
    [origin.lon + 18, origin.lat + 12],
    ...quotes.map((q) => [q.destination.lon, q.destination.lat] as [number, number]),
  ];
  const projection = geoNaturalEarth1().fitExtent(
    [
      [PAD, PAD],
      [W - PAD, H - PAD],
    ],
    { type: "MultiPoint", coordinates: points },
  );
  const path = geoPath(projection);
  const project = (a: Airport) => projection([a.lon, a.lat]) ?? [W / 2, H / 2];
  const [ox, oy] = project(origin);

  const highlighted = new Set(quotes.slice(0, 6).map((q) => q.destination.code));
  const prices = quotes.map((q) => q.cheapest.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const dots = quotes.map((q) => {
    const [x, y] = project(q.destination);
    // Cheaper → stronger: single-hue sequential encoding of price.
    const t = maxP === minP ? 1 : 1 - (q.cheapest.price - minP) / (maxP - minP);
    return { q, x, y, t };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full overflow-hidden rounded-2xl"
      role="group"
      aria-label={`World map of destinations from ${origin.city}`}
    >
      <rect width={W} height={H} fill="var(--accent)" fillOpacity="0.55" />
      <path d={path(LAND) ?? undefined} fill="var(--card)" stroke="var(--border)" strokeWidth="0.8" />

      {dots.map(({ q }) => (
        <path
          key={`route-${q.destination.code}`}
          d={
            path({
              type: "LineString",
              coordinates: [
                [origin.lon, origin.lat],
                [q.destination.lon, q.destination.lat],
              ],
            }) ?? undefined
          }
          fill="none"
          stroke="var(--primary)"
          strokeOpacity={highlighted.has(q.destination.code) ? 0.45 : 0.14}
          strokeWidth={highlighted.has(q.destination.code) ? 1.5 : 1}
          strokeDasharray={highlighted.has(q.destination.code) ? undefined : "3 4"}
        />
      ))}

      {dots.map(({ q, x, y, t }) => {
        const featured = highlighted.has(q.destination.code);
        const labelLeft = x > W - 200;
        return (
          <Link key={q.destination.code} href={hrefFor(q)} className="group outline-none">
            <title>{`${q.destination.city}, ${q.destination.country} — from ${money(q.cheapest.price)}`}</title>
            <circle cx={x} cy={y} r="18" fill="transparent" />
            <circle
              cx={x}
              cy={y}
              r={featured ? 9 : 6.5}
              fill={featured ? "var(--sunrise)" : "var(--primary)"}
              fillOpacity={featured ? 1 : 0.4 + t * 0.6}
              stroke="var(--card)"
              strokeWidth="2"
              className="transition-all group-hover:stroke-foreground group-focus-visible:stroke-foreground"
            />
            {!featured && (
              <text
                x={labelLeft ? x - 13 : x + 13}
                y={y + 6}
                textAnchor={labelLeft ? "end" : "start"}
                fontSize="19"
                fontWeight="700"
                fill="var(--foreground)"
                stroke="var(--card)"
                strokeWidth="5"
                paintOrder="stroke"
                pointerEvents="none"
                className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {q.destination.city} {money(q.cheapest.price)}
              </text>
            )}
          </Link>
        );
      })}

      {/* Labels for the cheapest few, drawn last so dots never cover them; skip any that would collide. */}
      <g pointerEvents="none" aria-hidden="true">
        {placeLabels(
          dots.filter((d) => highlighted.has(d.q.destination.code)),
          { x: ox, y: oy },
        ).map(({ q, x, y, left }) => (
          <text
            key={`label-${q.destination.code}`}
            x={left ? x - 13 : x + 13}
            y={y + 6}
            textAnchor={left ? "end" : "start"}
            fontSize="19"
            fontWeight="700"
            fill="var(--foreground)"
            stroke="var(--card)"
            strokeWidth="5"
            paintOrder="stroke"
          >
            {q.destination.city} {money(q.cheapest.price)}
          </text>
        ))}
      </g>

      <circle cx={ox} cy={oy} r="10" fill="var(--foreground)" stroke="var(--card)" strokeWidth="3" />
      <text
        x={ox}
        y={oy + 32}
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        fill="var(--foreground)"
        stroke="var(--card)"
        strokeWidth="5"
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
function placeLabels(dots: PlacedDot[], origin: { x: number; y: number }) {
  const boxes: { x1: number; x2: number; y1: number; y2: number }[] = [
    { x1: origin.x - 50, x2: origin.x + 50, y1: origin.y - 12, y2: origin.y + 40 },
  ];
  const placed: (PlacedDot & { left: boolean })[] = [];
  for (const dot of dots) {
    const width = (dot.q.destination.city.length + 7) * 11;
    for (const left of [dot.x > W - 200, dot.x <= W - 200]) {
      const x1 = left ? dot.x - 13 - width : dot.x + 13;
      const box = { x1, x2: x1 + width, y1: dot.y - 13, y2: dot.y + 13 };
      const hit = box.x1 < 0 || box.x2 > W || boxes.some((b) => box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1);
      if (!hit) {
        boxes.push(box);
        placed.push({ ...dot, left });
        break;
      }
    }
  }
  return placed;
}
