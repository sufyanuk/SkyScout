import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <defs>
        <linearGradient id="ss-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b63ff" />
          <stop offset="1" stopColor="#1530b8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#ss-logo)" />
      <path d="M7 22.5c3.5-7.5 9.5-11.5 16-12" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.01 4.4" />
      <circle cx="23.5" cy="10.5" r="3.2" fill="#ff6a3d" />
      <circle cx="7" cy="22.5" r="1.9" fill="#fff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2 rounded-xl", className)} aria-label="SkyScout home">
      <LogoMark className="transition-transform group-hover:-rotate-6" />
      <span className="text-lg font-semibold tracking-tight">
        Sky<span className="text-primary">Scout</span>
      </span>
    </Link>
  );
}
