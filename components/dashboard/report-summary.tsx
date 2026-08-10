import type { ReportMeta } from "@/lib/report";
import { visitsLabel } from "@/lib/format";
import { OutcomeBar, OutcomeLegend } from "./outcome-bar";

/*
 * The team's whole period as one bar, sitting directly above the per-delegate
 * bars so the reading is learned once and reused down the table.
 *
 * Everything here is counted per *task* (summing to `inRange`), not per
 * assignment. The table below counts per assignee, so a co-assigned task
 * appears in several rows. Both are correct for their own question — "how much
 * work is there" versus "who is accountable for it" — and the footnote under
 * the table names the gap rather than leaving the reader to find it.
 */
export function ReportSummary({ meta }: { meta: ReportMeta }) {
  const { completed, remaining, failures } = meta.taskMetrics;

  return (
    <section className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex items-baseline gap-3">
          <span className="font-heading text-4xl leading-none font-bold tabular-nums sm:text-5xl">
            {meta.inRange}
          </span>
          <span className="text-sm text-muted-foreground">
            {visitsLabel(meta.inRange)} في هذه الفترة
          </span>
        </div>

        <OutcomeLegend completed={completed} remaining={remaining} failures={failures} />
      </div>

      <OutcomeBar
        size="lg"
        className="mt-5"
        total={meta.inRange}
        completed={completed}
        remaining={remaining}
        failures={failures}
      />
    </section>
  );
}
