import { classify } from "./clickup/status";
import type { Metric } from "./clickup/metrics";
import type { ClickUpTask } from "./clickup/types";
import type { DayRange } from "./date-range";

/** Row label for tasks nobody is assigned to. */
export const UNASSIGNED_LABEL = "غير مسند";

export interface DelegateRow {
  /** null for the غير مسند row. */
  assigneeId: number | null;
  name: string;
  avatar: string | null;
  total: number;
  completed: number;
  remaining: number;
  failures: number;
}

export interface ReportMeta {
  from: string;
  to: string;
  /** Tasks on the list before date filtering. */
  fetched: number;
  /** Tasks falling inside the range — the real denominator. */
  inRange: number;
  /** Of those, how many were dated by the date_created fallback. */
  datedByFallback: number;
  /** Of those, how many carry 2+ assignees and so are counted more than once. */
  multiAssigned: number;
  unassigned: number;
  /**
   * Sum of every row's total. Exceeds `inRange` by exactly the number of extra
   * co-assignments, because a shared task credits each assignee.
   */
  assignments: number;
  /**
   * Metric counts per *task*, so they sum to `inRange` rather than to
   * `assignments`. The table reports per-delegate accountability, where a
   * shared task is counted for each assignee; the summary above it reports how
   * much work actually exists. Conflating the two would misstate both.
   */
  taskMetrics: Record<Metric, number>;
}

export interface Report {
  rows: DelegateRow[];
  meta: ReportMeta;
}

export type DateSource = "due_date" | "date_created";

/**
 * The date a task is filtered on.
 *
 * `due_date` is the scheduled visit date and the intended field, but it is
 * unset on roughly a quarter of the list. Falling back to `date_created`
 * (always present) keeps those tasks visible instead of dropping them from
 * every report; `meta.datedByFallback` reports how often that happens.
 */
export function effectiveDate(task: ClickUpTask): { ms: number; source: DateSource } {
  if (task.due_date) return { ms: Number(task.due_date), source: "due_date" };
  return { ms: Number(task.date_created), source: "date_created" };
}

function emptyRow(assigneeId: number | null, name: string, avatar: string | null): DelegateRow {
  return { assigneeId, name, avatar, total: 0, completed: 0, remaining: 0, failures: 0 };
}

/**
 * Group tasks in the range into one row per assignee.
 *
 * A task assigned to several delegates is counted in full for each of them —
 * per-delegate accountability is the point of the table. That makes the column
 * totals across rows exceed the task count, which `meta.assignments` makes
 * explicit so the UI can footnote it.
 */
export function buildReport(tasks: ClickUpTask[], range: DayRange): Report {
  const inRange = tasks.filter((task) => {
    const { ms } = effectiveDate(task);
    return ms >= range.startMs && ms <= range.endMs;
  });

  const rows = new Map<string, DelegateRow>();
  const taskMetrics: Record<Metric, number> = { completed: 0, remaining: 0, failures: 0 };
  let datedByFallback = 0;
  let multiAssigned = 0;
  let unassigned = 0;

  for (const task of inRange) {
    if (effectiveDate(task).source === "date_created") datedByFallback++;
    if (task.assignees.length > 1) multiAssigned++;

    const metric: Metric = classify(task.status.status);
    taskMetrics[metric]++;
    const targets =
      task.assignees.length > 0
        ? task.assignees.map((a) => ({
            key: String(a.id),
            id: a.id,
            name: a.username.trim(),
            avatar: a.profilePicture ?? null,
          }))
        : [{ key: "unassigned", id: null, name: UNASSIGNED_LABEL, avatar: null }];

    if (task.assignees.length === 0) unassigned++;

    for (const target of targets) {
      let row = rows.get(target.key);
      if (!row) {
        row = emptyRow(target.id, target.name, target.avatar);
        rows.set(target.key, row);
      }
      row.total++;
      row[metric]++;
    }
  }

  const result = [...rows.values()].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name, "ar"),
  );

  for (const row of result) {
    const sum = row.completed + row.remaining + row.failures;
    if (sum !== row.total) {
      // Unreachable unless classify() gains a bucket that isn't counted above.
      throw new Error(
        `Invariant broken for "${row.name}": total ${row.total} != ${sum} ` +
          `(${row.completed}+${row.remaining}+${row.failures}).`,
      );
    }
  }

  return {
    rows: result,
    meta: {
      from: range.from,
      to: range.to,
      fetched: tasks.length,
      inRange: inRange.length,
      datedByFallback,
      multiAssigned,
      unassigned,
      assignments: result.reduce((n, row) => n + row.total, 0),
      taskMetrics,
    },
  };
}
