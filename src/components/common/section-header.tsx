import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "See all",
  id,
  size = "md",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
  id?: string;
  /** "sm" for secondary sections. */
  size?: "md" | "sm";
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
        <h2
          id={id}
          className={size === "sm" ? "mt-1 text-xl font-semibold tracking-tight sm:text-2xl" : "mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"}
        >
          {title}
        </h2>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 rounded-full text-sm font-semibold text-primary hover:underline underline-offset-4"
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
