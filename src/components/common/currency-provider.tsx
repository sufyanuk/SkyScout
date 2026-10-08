"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { convert, DEFAULT_CURRENCY, formatMoney, toUsd, type CurrencyCode } from "@/lib/currency";

interface CurrencyContextValue {
  currency: CurrencyCode;
  /** Format a USD amount in the visitor's currency. */
  format: (usd: number) => string;
  convert: (usd: number) => number;
  toUsd: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  format: (usd) => formatMoney(usd, DEFAULT_CURRENCY),
  convert: (usd) => usd,
  toUsd: (amount) => amount,
});

export function CurrencyProvider({ currency, children }: { currency: CurrencyCode; children: ReactNode }) {
  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      format: (usd) => formatMoney(usd, currency),
      convert: (usd) => convert(usd, currency),
      toUsd: (amount) => toUsd(amount, currency),
    }),
    [currency],
  );
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
