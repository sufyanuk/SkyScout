"use client";

import { useState } from "react";
import { ArrowRight, Copy, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/components/common/currency-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BookDialogProps {
  summary: {
    route: string;
    dates: string;
    airline: string;
    priceUsd: number;
    travelers: number;
    flights: string[];
  };
  provider: string;
  label?: string;
  size?: "default" | "lg" | "xl";
  className?: string;
}

/**
 * "Search this flight" CTA. The mock provider has no booking partner, so this
 * explains what would happen and lets the traveller copy the itinerary rather
 * than sending them to a fake URL.
 */
export function BookDialog({ summary, provider, label = "Search this flight", size = "xl", className }: BookDialogProps) {
  const [open, setOpen] = useState(false);
  const { format } = useCurrency();
  const price = format(summary.priceUsd);
  const itinerary = [
    `${summary.route} · ${summary.dates}`,
    `${summary.airline} — ${summary.flights.join(", ")}`,
    `${price} per traveller (${summary.travelers} traveller${summary.travelers > 1 ? "s" : ""})`,
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(itinerary);
      toast.success("Itinerary copied", { description: "Paste it into your airline or travel agent's search." });
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant="sunrise" className={className}>
          {label} <ArrowRight className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ready to book {summary.route}?</DialogTitle>
          <DialogDescription>
            In production, this button hands you to a booking partner with the fare pre-selected.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-muted p-4 text-sm">
          <p className="font-semibold">{summary.route}</p>
          <p className="text-muted-foreground">{summary.dates}</p>
          <p className="mt-2">{summary.airline}</p>
          <p className="text-muted-foreground">{summary.flights.join(" · ")}</p>
          <p className="mt-2 text-lg font-semibold">
            {price} <span className="text-sm font-normal text-muted-foreground">per traveller</span>
          </p>
        </div>
        {provider === "mock" && (
          <p className="flex gap-2 rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            This fare comes from SkyScout&apos;s demo data provider, so there&apos;s no live seat to book. Connect a real
            flight API to enable partner checkout.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={copy}>
            <Copy /> Copy itinerary
          </Button>
          <Button onClick={() => setOpen(false)}>
            <ExternalLink /> Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
