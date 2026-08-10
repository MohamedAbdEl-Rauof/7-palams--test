/** The three status buckets that make up a delegate row. */
export type Metric = "completed" | "remaining" | "failures";

/** Arabic column headings, kept next to the type they label. */
export const METRIC_LABELS: Record<Metric | "total", string> = {
  total: "إجمالي",
  completed: "مكتمل",
  remaining: "متبقي",
  failures: "إخفاقات",
};
