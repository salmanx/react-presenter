import type { FormatAdapter } from "./types";
import { getPresenterConfig } from "./config";

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

const RELATIVE_DIVISORS_MS: Record<string, number> = {
  year: 1000 * 60 * 60 * 24 * 365,
  quarter: 1000 * 60 * 60 * 24 * 91,
  month: 1000 * 60 * 60 * 24 * 30,
  week: 1000 * 60 * 60 * 24 * 7,
  day: 1000 * 60 * 60 * 24,
  hour: 1000 * 60 * 60,
  minute: 1000 * 60,
  second: 1000,
};

/**
 * Build a locale-aware formatter. Presenters call this via `this.format`,
 * automatically passing `context.locale` — you rarely need to call it
 * directly.
 */
export function createFormatAdapter(locale?: string): FormatAdapter {
  const config = getPresenterConfig();
  const resolvedLocale = locale ?? config.locale ?? "en-US";
  const overrides = config.formatters ?? {};

  const base: FormatAdapter = {
    date(value, options) {
      return new Intl.DateTimeFormat(resolvedLocale, options).format(toDate(value));
    },
    number(value, options) {
      return new Intl.NumberFormat(resolvedLocale, options).format(value);
    },
    currency(value, currency = "USD", options) {
      return new Intl.NumberFormat(resolvedLocale, {
        style: "currency",
        currency,
        ...options,
      }).format(value);
    },
    relativeTime(value, unit = "day") {
      const date = toDate(value);
      const diffMs = date.getTime() - Date.now();
      const divisor = RELATIVE_DIVISORS_MS[unit] ?? RELATIVE_DIVISORS_MS.day;
      const rtf = new Intl.RelativeTimeFormat(resolvedLocale, { numeric: "auto" });
      return rtf.format(Math.round(diffMs / divisor), unit);
    },
  };

  return { ...base, ...overrides };
}
