/**
 * Display currencies. All fares are stored and compared in USD; these
 * indicative rates convert for display only. Swap in a live FX feed by
 * replacing RATES (e.g. refreshed daily on the server).
 */
export const CURRENCIES = [
  { code: "USD", name: "US Dollar", rate: 1 },
  { code: "EUR", name: "Euro", rate: 0.92 },
  { code: "GBP", name: "British Pound", rate: 0.79 },
  { code: "QAR", name: "Qatari Riyal", rate: 3.64 },
  { code: "AED", name: "UAE Dirham", rate: 3.6725 },
  { code: "SAR", name: "Saudi Riyal", rate: 3.75 },
  { code: "OMR", name: "Omani Rial", rate: 0.385 },
  { code: "KWD", name: "Kuwaiti Dinar", rate: 0.307 },
  { code: "BHD", name: "Bahraini Dinar", rate: 0.376 },
  { code: "INR", name: "Indian Rupee", rate: 83.4 },
  { code: "PKR", name: "Pakistani Rupee", rate: 278 },
  { code: "TRY", name: "Turkish Lira", rate: 34.2 },
  { code: "SGD", name: "Singapore Dollar", rate: 1.34 },
  { code: "AUD", name: "Australian Dollar", rate: 1.51 },
  { code: "CAD", name: "Canadian Dollar", rate: 1.37 },
  { code: "JPY", name: "Japanese Yen", rate: 149 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const DEFAULT_CURRENCY: CurrencyCode = "USD";
export const CURRENCY_COOKIE = "ss_currency";

const RATES = new Map<string, number>(CURRENCIES.map((c) => [c.code, c.rate]));

export function isCurrency(code: string | null | undefined): code is CurrencyCode {
  return !!code && RATES.has(code.toUpperCase());
}

export function toCurrency(code: string | null | undefined): CurrencyCode {
  return isCurrency(code) ? (code.toUpperCase() as CurrencyCode) : DEFAULT_CURRENCY;
}

/** USD → display currency. */
export function convert(usd: number, code: CurrencyCode): number {
  return usd * (RATES.get(code) ?? 1);
}

/** Display currency → USD (for budgets typed by the user). */
export function toUsd(amount: number, code: CurrencyCode): number {
  return amount / (RATES.get(code) ?? 1);
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(usd: number, code: CurrencyCode = DEFAULT_CURRENCY): string {
  let f = formatters.get(code);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0, minimumFractionDigits: 0 });
    formatters.set(code, f);
  }
  return f.format(convert(usd, code));
}

/** Round a display-currency amount to a "nice" preset value. */
export function niceAmount(value: number): number {
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(1, value))) - 1);
  return Math.round(value / magnitude) * magnitude;
}
