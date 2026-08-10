import { format, parse } from "date-fns";
import { arSA } from "date-fns/locale";

/*
 * Display formatting for the dashboard.
 *
 * Digits stay Latin (0-9) throughout, never Arabic-Indic — a spec requirement,
 * and the reason every count is rendered with `tabular-nums` so columns align.
 * date-fns formats month names from the locale but never localises numerals,
 * so `arSA` gives us Arabic months with Latin figures for free.
 */

export const DAY_FORMAT = "yyyy-MM-dd";

/** Parse a yyyy-MM-dd day string into a local Date for the calendar UI. */
export function parseDay(day: string): Date {
  return parse(day, DAY_FORMAT, new Date());
}

/** Serialise a Date back to yyyy-MM-dd using local (not UTC) components. */
export function toDay(date: Date): string {
  return format(date, DAY_FORMAT);
}

/** "10 أغسطس 2026" */
export function formatDay(day: string): string {
  return format(parseDay(day), "d MMMM yyyy", { locale: arSA });
}

/**
 * A range as one line. Collapses the shared month or year so the common case
 * reads "1 – 31 أغسطس 2026" instead of repeating the month twice.
 */
export function formatRange(from: string, to: string): string {
  const start = parseDay(from);
  const end = parseDay(to);

  if (from === to) return formatDay(from);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${format(start, "d", { locale: arSA })} – ${format(end, "d MMMM yyyy", { locale: arSA })}`;
  }
  if (sameYear) {
    return `${format(start, "d MMMM", { locale: arSA })} – ${format(end, "d MMMM yyyy", { locale: arSA })}`;
  }
  return `${formatDay(from)} – ${formatDay(to)}`;
}

/**
 * Arabic count agreement for "زيارة".
 *
 * Arabic does not have a single plural: 1 takes the singular, 2 the dual, 3–10
 * the plural, and 11+ returns to the singular after the numeral. Rendering
 * "زيارات" for every count would read as broken Arabic to the executive this
 * dashboard is built for.
 */
export function visitsLabel(count: number): string {
  const n = Math.abs(count) % 100;
  if (n === 1) return "زيارة واحدة";
  if (n === 2) return "زيارتان";
  if (n >= 3 && n <= 10) return "زيارات";
  return "زيارة";
}

/** Percentage of a whole, rounded, guarding against an empty row. */
export function share(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}
