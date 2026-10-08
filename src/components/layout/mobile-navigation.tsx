"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, MOBILE_NAV } from "./nav-items";

/** Thumb-friendly bottom tab bar, shown below the md breakpoint. */
export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
                  active && "text-primary",
                )}
              >
                <Icon className={cn("size-[22px]", active && "fill-primary/10")} strokeWidth={active ? 2.3 : 1.9} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
