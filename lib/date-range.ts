/*
 * Day-range parsing in the workspace's timezone.
 *
 * Saudi Arabia is permanently UTC+3 (Arabia Standard Time) and has never
 * observed DST, so a fixed offset is exact here — no tz database needed.
 * Resolving boundaries in UTC instead would shift every range by three hours
 * and move evening visits into the neighbouring day.
 */
const RIYADH_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class InvalidDateError extends Error {
  constructor(param: string, value: string) {
    super(`Invalid ${param}="${value}" — expected a real calendar date as yyyy-MM-dd.`);
    this.name = "InvalidDateError";
  }
}

export class InvalidRangeError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid range: from="${from}" is after to="${to}".`);
    this.name = "InvalidRangeError";
  }
}

/** Midnight in Riyadh on the given day, as a UTC instant. */
function startOfDayMs(day: string, param: string): number {
  const match = DAY_PATTERN.exec(day);
  if (!match) throw new InvalidDateError(param, day);

  const [, y, m, d] = match.map(Number) as [unknown, number, number, number];
  const utcMidnight = Date.UTC(y, m - 1, d);

  // Date.UTC silently rolls over impossible dates (2026-02-30 → 2026-03-02),
  // so round-trip the components to reject them.
  const check = new Date(utcMidnight);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    throw new InvalidDateError(param, day);
  }

  return utcMidnight - RIYADH_UTC_OFFSET_MS;
}

export interface DayRange {
  /** Inclusive start instant (ms epoch). */
  startMs: number;
  /** Inclusive end instant (ms epoch) — 23:59:59.999 Riyadh on `to`. */
  endMs: number;
  from: string;
  to: string;
}

/** Parse an inclusive `from`..`to` day range, both in Riyadh local time. */
export function parseDayRange(from: string, to: string): DayRange {
  const startMs = startOfDayMs(from, "from");
  const endMs = startOfDayMs(to, "to") + 24 * 60 * 60 * 1000 - 1;
  if (startMs > endMs) throw new InvalidRangeError(from, to);
  return { startMs, endMs, from, to };
}

/** The current month in Riyadh, used when the request omits a range. */
export function currentMonthRange(now: number = Date.now()): DayRange {
  const riyadh = new Date(now + RIYADH_UTC_OFFSET_MS);
  const year = riyadh.getUTCFullYear();
  const month = riyadh.getUTCMonth();
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return parseDayRange(
    `${year}-${pad(month + 1)}-01`,
    `${year}-${pad(month + 1)}-${pad(lastDay)}`,
  );
}
