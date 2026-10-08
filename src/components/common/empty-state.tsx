import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-3xl border border-dashed bg-card/60 px-6 py-14 text-center", className)}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      {description && <div className="mt-2 max-w-md text-sm text-muted-foreground">{description}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
