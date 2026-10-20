"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setRegion } from "@/actions/preferences";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, currencyForCountry, getCountry } from "@/lib/catalog/countries";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

const LANGUAGE = "English (UK)";

function Flag({ code, className }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static flag from flagcdn
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      width={20}
      height={14}
      loading="lazy"
      className={className ?? "h-3.5 w-5 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"}
    />
  );
}

/** Header button showing language · country · currency, with a dialog to change them. */
export function RegionSettings({ countryCode, currency }: { countryCode: string; currency: CurrencyCode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(countryCode);
  const [money, setMoney] = useState<string>(currency);
  const [pending, startTransition] = useTransition();
  const current = getCountry(countryCode);
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol;

  function openChange(next: boolean) {
    if (next) {
      setCountry(countryCode);
      setMoney(currency);
    }
    setOpen(next);
  }

  /** Choices apply straight away — no separate save step. */
  function apply(nextCountry: string, nextCurrency: string) {
    setCountry(nextCountry);
    setMoney(nextCurrency);
    startTransition(async () => {
      const result = await setRegion(nextCountry, nextCurrency);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't save your settings");
        return;
      }
      router.refresh();
    });
  }

  // A new country switches to its local currency; the visitor can still pick another.
  const pickCountry = (code: string) => apply(code, currencyForCountry(code) ?? money);
  const pickCurrency = (code: string) => apply(country, code);

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Regional settings: ${LANGUAGE}, ${current?.name ?? countryCode}, ${currency}`}
          className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-2 text-[12px] sm:gap-2 sm:px-3.5 font-medium text-foreground transition-colors hover:bg-primary/15"
        >
          <span className="hidden xl:inline">{LANGUAGE}</span>
          <span aria-hidden="true" className="hidden text-foreground/30 xl:inline">
            |
          </span>
          <span className="flex items-center gap-1.5">
            <Flag code={countryCode} />
            <span className="hidden xl:inline">{current?.name}</span>
          </span>
          <span aria-hidden="true" className="hidden text-foreground/30 min-[400px]:inline">
            |
          </span>
          <span className="flex items-center gap-1">
            {symbol && symbol !== "$" && <span className="hidden xl:inline">{symbol}</span>}
            <span>{currency}</span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regional settings</DialogTitle>
          <DialogDescription>
            Your country sets where flights depart from and switches prices to its currency. Changes apply straight
            away.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="region-language">Language</Label>
            <Select value="en-GB" disabled>
              <SelectTrigger id="region-language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-GB">{LANGUAGE}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="region-country">Country / region</Label>
            <Select value={country} onValueChange={pickCountry} disabled={pending}>
              <SelectTrigger id="region-country" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <Flag code={c.code} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="region-currency">Currency</Label>
            <Select value={money} onValueChange={pickCurrency} disabled={pending}>
              <SelectTrigger id="region-currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} · {c.name} <span className="text-muted-foreground">{c.symbol}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="items-center">
          {pending && (
            <span className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Updating prices…
            </span>
          )}
          <Button onClick={() => setOpen(false)} disabled={pending}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
