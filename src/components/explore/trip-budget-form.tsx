"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Wallet, X } from "lucide-react";
import { useCurrency } from "@/components/common/currency-provider";
import { Button } from "@/components/ui/button";
import type { TravelStyle } from "@/lib/catalog/trip-costs";
import { cn } from "@/lib/utils";

const NIGHT_OPTIONS = [2, 3, 4, 5, 7, 10, 14];

/**
 * "I have X for N nights — where can I go?" Budgets are typed in the
 * visitor's currency and stored in the URL in USD so links stay shareable.
 */
export function TripBudgetForm({
  query,
  budgetUsd,
  nights,
  style,
}: {
  query: string;
  budgetUsd: number | null;
  nights: number;
  style: TravelStyle;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const money = useCurrency();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(budgetUsd ? String(Math.round(money.convert(budgetUsd))) : "");
  const [n, setN] = useState(nights);
  const [s, setS] = useState<TravelStyle>(style);

  function go(patch: Record<string, string | null>) {
    const sp = new URLSearchParams(query);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    go({ budget: String(Math.round(money.toUsd(value))), nights: String(n), style: s, max: null });
  }

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden rounded-[2rem] bg-foreground p-5 text-white shadow-lift sm:p-6"
      aria-label="Plan by total trip budget"
    >
      <div className="pointer-events-none absolute -top-20 -right-10 size-56 rounded-full bg-primary/40 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="mr-auto">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sunrise">
            <Wallet className="size-3.5" aria-hidden="true" /> Trip budget
          </p>
          <p className="mt-1 text-lg font-semibold">Where can my budget take me?</p>
          <p className="text-sm text-white/70">Flight + stay + daily spending, per person.</p>
        </div>
        <label className="space-y-1">
          <span className="block text-xs text-white/70">Total budget</span>
          <span className="flex h-11 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20 focus-within:ring-2 focus-within:ring-sunrise">
            <span className="flex items-center px-3 text-sm font-semibold text-white/80">{money.currency}</span>
            <input
              type="number"
              inputMode="numeric"
              min={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="800"
              className="w-28 bg-transparent pr-3 text-[15px] font-semibold text-white outline-none placeholder:text-white/40"
            />
          </span>
        </label>
        <label className="space-y-1">
          <span className="block text-xs text-white/70">Nights</span>
          <select
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="h-11 rounded-xl bg-white/10 px-3 text-[15px] font-semibold text-white ring-1 ring-white/20 outline-none focus:ring-2 focus:ring-sunrise [&>option]:text-foreground"
          >
            {NIGHT_OPTIONS.map((x) => (
              <option key={x} value={x}>
                {x} nights
              </option>
            ))}
          </select>
        </label>
        <div role="radiogroup" aria-label="Travel style" className="flex h-11 items-center rounded-xl bg-white/10 p-1 ring-1 ring-white/20">
          {(["budget", "comfort"] as const).map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={s === x}
              onClick={() => setS(x)}
              className={cn("h-full rounded-lg px-3 text-sm font-semibold capitalize text-white/70", s === x && "bg-white text-foreground")}
            >
              {x}
            </button>
          ))}
        </div>
        <Button type="submit" variant="sunrise" size="lg" disabled={pending} className="h-11">
          {pending && <Loader2 className="animate-spin" />} Show trips
        </Button>
        {budgetUsd && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-11 text-white hover:bg-white/10 hover:text-white"
            onClick={() => go({ budget: null, nights: null, style: null })}
          >
            <X /> Clear
          </Button>
        )}
      </div>
    </form>
  );
}
