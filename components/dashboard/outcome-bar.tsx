import { cn } from "@/lib/utils";
import { share } from "@/lib/format";

/*
 * The dashboard's one repeated visual idea: a delegate's whole record as a
 * single shape.
 *
 * Four counts in four columns force the reader to do arithmetic to learn the
 * thing that actually matters — the ratio. 9 visits with 0 completed and 7
 * visits with 5 completed look similar as digits and nothing alike as bars.
 * The same component renders the team total above the table, so the reading
 * is learned once and then applied down every row.
 *
 * Segment order follows the reading direction: completed leads from the start
 * edge, failures are anchored at the far end where the eye lands last and
 * stays.
 */

export interface OutcomeBarProps {
  completed: number;
  remaining: number;
  failures: number;
  total: number;
  /** `lg` is the team bar above the table; `sm` sits inside a row. */
  size?: "sm" | "lg";
  /**
   * Bar length as a percentage of the column, so row bars encode volume as
   * well as ratio. Without it a delegate with a single completed visit draws
   * the same full-width green bar as one with nine, and the eye reads them as
   * equal achievements. Omitted (100) for the full-width team bar.
   */
  widthPct?: number;
  className?: string;
}

const SEGMENTS = [
  { key: "completed", label: "مكتمل", color: "bg-success" },
  { key: "remaining", label: "متبقي", color: "bg-warning" },
  { key: "failures", label: "إخفاقات", color: "bg-danger" },
] as const;

export function OutcomeBar({
  completed,
  remaining,
  failures,
  total,
  size = "sm",
  widthPct = 100,
  className,
}: OutcomeBarProps) {
  const values = { completed, remaining, failures };

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-full",
        // The team bar spans the full width and sits in a track. Row bars are
        // scaled, so a track would imply a target they are progressing toward
        // rather than a length that simply means "more visits".
        size === "lg" ? "h-3 bg-muted" : "h-2",
        className,
      )}
      style={size === "lg" ? undefined : { width: `${Math.max(widthPct, 4)}%` }}
      role="img"
      aria-label={
        total === 0
          ? "لا توجد زيارات"
          : `من ${total}: مكتمل ${completed}، متبقي ${remaining}، إخفاقات ${failures}`
      }
    >
      {SEGMENTS.map(({ key, color }) => {
        const value = values[key];
        if (value === 0) return null;
        return (
          <div
            key={key}
            className={color}
            // Percentages rather than flex-grow so a 1-of-9 sliver stays
            // proportional instead of being rounded up to a visible chunk.
            style={{ width: `${share(value, total)}%` }}
          />
        );
      })}
    </div>
  );
}

/** Colour key for the team bar. The row bars inherit the same mapping. */
export function OutcomeLegend({
  completed,
  remaining,
  failures,
}: Omit<OutcomeBarProps, "total" | "size" | "className">) {
  const values = { completed, remaining, failures };

  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {SEGMENTS.map(({ key, label, color }) => (
        <li key={key} className="flex items-center gap-2">
          <span className={cn("size-2.5 shrink-0 rounded-full", color)} aria-hidden />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="font-heading text-sm font-medium tabular-nums">{values[key]}</span>
        </li>
      ))}
    </ul>
  );
}
