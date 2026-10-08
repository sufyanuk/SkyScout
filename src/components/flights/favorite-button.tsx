"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useViewer } from "@/components/common/viewer-provider";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  dealId: string;
  label?: string;
  className?: string;
  /** Show text next to the icon (detail page). */
  withText?: boolean;
  /** Refresh server data after removal (favourites page). */
  refreshOnChange?: boolean;
}

export function FavoriteButton({ dealId, label = "this deal", className, withText, refreshOnChange }: FavoriteButtonProps) {
  const { isAuthenticated, isSaved, setSaved } = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const saved = isSaved(dealId);

  async function toggle() {
    if (!isAuthenticated) {
      toast("Log in to save deals", {
        description: "Saved deals sync across your devices.",
        action: { label: "Log in", onClick: () => router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`) },
      });
      return;
    }
    const next = !saved;
    setSaved(dealId, next);
    setBusy(true);
    try {
      const res = next
        ? await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dealId }),
          })
        : await fetch(`/api/favorites/${encodeURIComponent(dealId)}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Something went wrong");
      }
      toast.success(next ? "Saved to your flights" : "Removed from saved flights", {
        action: next ? { label: "View saved", onClick: () => router.push("/favorites") } : undefined,
      });
      if (refreshOnChange) router.refresh();
    } catch (error) {
      setSaved(dealId, !next);
      toast.error(error instanceof Error ? error.message : "Couldn't update saved flights");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from saved flights` : `Save ${label}`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-70",
        withText ? "h-10 border bg-card px-4 text-sm font-semibold hover:bg-muted" : "size-9 bg-card/90 shadow-sm backdrop-blur hover:scale-105",
        className,
      )}
    >
      <Heart
        className={cn("size-[18px] transition-colors", saved ? "fill-sunrise text-sunrise" : "text-foreground/70")}
        aria-hidden="true"
      />
      {withText && (saved ? "Saved" : "Save")}
    </button>
  );
}
