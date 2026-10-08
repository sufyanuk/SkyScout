import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The labelled "tile" look shared by every search field. */
export function FieldShell({
  label,
  htmlFor,
  icon,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[60px] items-center gap-3 rounded-2xl border border-input bg-card px-4 transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/15 hover:border-foreground/25",
        className,
      )}
    >
      {icon && <span className="text-muted-foreground [&_svg]:size-[18px]">{icon}</span>}
      <div className="flex min-w-0 flex-1 flex-col py-2">
        <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </label>
        {children}
      </div>
    </div>
  );
}
