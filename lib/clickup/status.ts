import type { Metric } from "./metrics";

/*
 * Task status → metric mapping.
 *
 * The list currently defines five statuses (verified against
 * GET /list/{id} during Phase 2 discovery):
 *
 *   ضروري الزيارة          open    → متبقي
 *   انتظار التصريح          custom  → متبقي
 *   لم تتم الزيارة          custom  → إخفاقات
 *   انتهت ولم تتم الزيارة   custom  → إخفاقات
 *   تمت الزيارة             closed  → مكتمل
 *
 * The three extra "remaining" entries below (البدء · تحت الدراسة ·
 * في انتظار الزيارة) come from the business-rules table in README.md but do
 * NOT exist on the list today. They are kept so that re-adding one in ClickUp
 * does not break the dashboard; they simply never match right now.
 */
const STATUS_MAP: Record<string, Metric> = {
  // مكتمل
  "تمت الزيارة": "completed",
  // متبقي
  "ضروري الزيارة": "remaining",
  "انتظار التصريح": "remaining",
  "البدء": "remaining",
  "تحت الدراسة": "remaining",
  "في انتظار الزيارة": "remaining",
  // إخفاقات
  "لم تتم الزيارة": "failures",
  "انتهت ولم تتم الزيارة": "failures",
};

/**
 * ClickUp lowercases status labels and the live data contains doubled spaces,
 * so compare on a canonical form rather than the raw string.
 */
function normalize(status: string): string {
  return status.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

const NORMALIZED_MAP = new Map<string, Metric>(
  Object.entries(STATUS_MAP).map(([status, metric]) => [normalize(status), metric]),
);

export class UnmappedStatusError extends Error {
  readonly status: string;
  constructor(status: string) {
    super(
      `Status "${status}" is not in STATUS_MAP. A status was renamed or added ` +
        `in ClickUp — update lib/clickup/status.ts and the table in README.md.`,
    );
    this.name = "UnmappedStatusError";
    this.status = status;
  }
}

/**
 * Bucket a raw ClickUp status into one of the three metrics.
 *
 * Throws on an unknown status rather than defaulting to "remaining". A renamed
 * status silently landing in the wrong bucket is the failure mode most likely
 * to go unnoticed — it keeps the per-row invariant satisfied while quietly
 * reporting wrong numbers to the executive reading the dashboard.
 */
export function classify(status: string): Metric {
  const metric = NORMALIZED_MAP.get(normalize(status));
  if (!metric) throw new UnmappedStatusError(status);
  return metric;
}

/** Statuses this build knows how to bucket — used by the diagnostics route. */
export function knownStatuses(): string[] {
  return Object.keys(STATUS_MAP);
}
