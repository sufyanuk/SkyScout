"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/components/common/currency-provider";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  text: string;
  /** Path to share, e.g. /deals/DOH-BKK-… */
  path: string;
  /** Replaces "{price}" in title/text, formatted in the visitor's currency. */
  priceUsd?: number;
  className?: string;
  withText?: boolean;
}

export function ShareButton({ title: rawTitle, text: rawText, path, priceUsd, className, withText }: ShareButtonProps) {
  const { format } = useCurrency();
  const fill = (t: string) => (priceUsd === undefined ? t : t.replaceAll("{price}", format(priceUsd)));
  const title = fill(rawTitle);
  const text = fill(rawText);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Link copied", { description: "Paste it anywhere to share this deal." });
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${title}`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        withText ? "h-10 border bg-card px-4 text-sm font-semibold hover:bg-muted" : "size-9 bg-card/90 shadow-sm backdrop-blur hover:scale-105",
        className,
      )}
    >
      <Share2 className="size-[17px] text-foreground/70" aria-hidden="true" />
      {withText && "Share"}
    </button>
  );
}
