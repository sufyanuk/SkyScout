"use client";

import { useCurrency } from "./currency-provider";

/**
 * Renders a USD amount in the visitor's chosen currency. Use this instead of
 * formatting prices inline so a currency switch updates every price.
 */
export function Price({ amount, className }: { amount: number; className?: string }) {
  const { format } = useCurrency();
  // Without a className render bare text so it also works inside SVG <text>/<title>.
  return className ? <span className={className}>{format(amount)}</span> : <>{format(amount)}</>;
}
