import { useId } from "react";
import type { ArtTheme } from "@/lib/catalog/destinations";
import { hashString } from "@/lib/flights/mock/random";
import { cn } from "@/lib/utils";

interface DestinationArtProps {
  code: string;
  theme: ArtTheme;
  from: string;
  to: string;
  className?: string;
  /** Show the large faded airport code. */
  showCode?: boolean;
}

/**
 * Original, dependency-free travel illustration: a gradient sky with a motif
 * for the destination's character. Swap for photography later by adding an
 * image URL to the destination catalog.
 */
export function DestinationArt({ code, theme, from, to, className, showCode = true }: DestinationArtProps) {
  const id = useId().replace(/:/g, "");
  const seed = hashString(code);
  // Keep the sun clear of the top corners, where cards overlay badges and buttons.
  const sunX = 210 + (seed % 90);
  const sunY = 100 + (seed % 30);

  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("block h-full w-full", className)}
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={to} />
          <stop offset="1" stopColor={from} />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#sky-${id})`} />
      <circle cx={sunX} cy={sunY} r="70" fill={`url(#glow-${id})`} opacity="0.55" />
      <circle cx={sunX} cy={sunY} r="24" fill="#fff" opacity="0.8" />
      {showCode && (
        <text x="22" y="200" fontSize="112" fontWeight="800" fill="#fff" opacity="0.14" letterSpacing="-4" fontFamily="ui-sans-serif, system-ui">
          {code}
        </text>
      )}
      <path
        d={`M-10 ${150 + (seed % 20)} Q 160 ${40 + (seed % 30)} ${sunX - 40} ${sunY + 10}`}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.7"
        strokeWidth="2"
        strokeDasharray="2 7"
        strokeLinecap="round"
      />
      <Motif theme={theme} seed={seed} />
    </svg>
  );
}

function Motif({ theme, seed }: { theme: ArtTheme; seed: number }) {
  const ink = "#0b1324";
  switch (theme) {
    case "skyline": {
      const buildings = Array.from({ length: 14 }, (_, i) => {
        const h = 40 + ((seed >>> (i % 16)) % 70) + (i === 6 ? 60 : 0);
        return { x: i * 30 - 6, w: 22 + (i % 3) * 4, h };
      });
      return (
        <g fill={ink} opacity="0.22">
          {buildings.map((b, i) => (
            <rect key={i} x={b.x} y={240 - b.h} width={b.w} height={b.h} rx="2" />
          ))}
          <rect x="0" y="228" width="400" height="12" />
        </g>
      );
    }
    case "mountains":
      return (
        <g>
          <path d="M0 240 L70 130 L130 190 L210 100 L300 200 L350 150 L400 190 L400 240 Z" fill={ink} opacity="0.16" />
          <path d="M0 240 L60 175 L120 215 L190 160 L260 220 L330 170 L400 225 L400 240 Z" fill={ink} opacity="0.24" />
          <path d="M197 108 L210 100 L224 116 L214 112 L206 118 Z" fill="#fff" opacity="0.7" />
        </g>
      );
    case "desert":
      return (
        <g>
          <path d="M0 200 Q 90 160 190 195 T 400 185 L400 240 L0 240 Z" fill={ink} opacity="0.14" />
          <path d="M0 225 Q 120 190 230 220 T 400 215 L400 240 L0 240 Z" fill={ink} opacity="0.22" />
        </g>
      );
    case "island":
      return (
        <g>
          <rect x="0" y="190" width="400" height="50" fill="#fff" opacity="0.18" />
          <path d="M120 196 Q 190 160 270 196 Z" fill={ink} opacity="0.25" />
          <path d="M196 178 q -4 -26 6 -42" stroke={ink} strokeOpacity="0.3" strokeWidth="3" fill="none" />
          <path d="M202 136 q -18 -4 -28 8 M202 136 q 16 -8 28 2 M202 136 q -4 -14 -18 -16" stroke={ink} strokeOpacity="0.3" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M0 214 q 25 -8 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" fill="none" />
        </g>
      );
    case "oldtown":
      return (
        <g fill={ink} opacity="0.22">
          <path d="M0 240 V190 H40 V170 H70 V200 H90 V160 a20 20 0 0 1 40 0 V200 H150 V140 l10 -24 l10 24 V200 H190 V175 H230 V150 a24 24 0 0 1 48 0 V205 H300 V180 H330 V160 l8 -20 l8 20 V200 H400 V240 Z" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M0 200 Q 100 185 200 200 T 400 198 L400 240 L0 240 Z" fill="#fff" opacity="0.25" />
          <path d="M0 218 q 25 -8 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" fill="none" />
          <path d="M0 232 q 25 -8 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" fill="none" />
        </g>
      );
  }
}
