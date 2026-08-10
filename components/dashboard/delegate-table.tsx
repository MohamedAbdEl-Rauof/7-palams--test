import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { METRIC_LABELS } from "@/lib/clickup/metrics";
import type { DelegateRow } from "@/lib/report";
import { UNASSIGNED_LABEL } from "@/lib/report";
import { OutcomeBar } from "./outcome-bar";

/*
 * Rows are ordered by workload (total visits), not by performance — so there
 * are deliberately no rank numerals. Numbering would read as a leaderboard and
 * imply the top row is the best performer, which the sort does not mean. The
 * bar carries performance; the order carries volume.
 */

function Count({ value, tone }: { value: number; tone?: "danger" }) {
  if (value === 0) {
    // A zero is noise in a scan. Dim it so the eye only catches real counts.
    return <span className="text-muted-foreground/40">0</span>;
  }
  return (
    <span className={cn("font-medium", tone === "danger" && "text-danger")}>{value}</span>
  );
}

export function DelegateTable({ rows }: { rows: DelegateRow[] }) {
  // Rows arrive sorted by total, so the longest bar is the first row and the
  // column reads as a ranked bar chart rather than a set of unrelated bars.
  const maxTotal = Math.max(1, ...rows.map((row) => row.total));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-start">المندوب</TableHead>
            <TableHead className="w-16 text-center">{METRIC_LABELS.total}</TableHead>
            <TableHead className="w-16 text-center">{METRIC_LABELS.completed}</TableHead>
            <TableHead className="w-16 text-center">{METRIC_LABELS.remaining}</TableHead>
            <TableHead className="w-20 text-center">{METRIC_LABELS.failures}</TableHead>
            <TableHead className="w-[22%] min-w-32 text-start">
              <span className="sr-only">توزيع الحالات</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => {
            const isUnassigned = row.assigneeId === null;
            return (
              <TableRow
                key={row.assigneeId ?? UNASSIGNED_LABEL}
                className={cn(isUnassigned && "text-muted-foreground")}
              >
                <TableCell className="max-w-56 truncate text-start font-medium" title={row.name}>
                  {row.name}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  <span className="font-heading font-semibold">{row.total}</span>
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  <Count value={row.completed} />
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  <Count value={row.remaining} />
                </TableCell>
                {/*
                 * The one column that breaks the table's uniformity. إخفاقات is
                 * the number an executive has to act on, so a non-zero value
                 * gets a tinted cell rather than sitting quietly in line with
                 * everything else.
                 */}
                <TableCell
                  className={cn(
                    "text-center tabular-nums",
                    row.failures > 0 && "bg-danger/8",
                  )}
                >
                  <Count value={row.failures} tone={row.failures > 0 ? "danger" : undefined} />
                </TableCell>
                <TableCell>
                  <OutcomeBar
                    completed={row.completed}
                    remaining={row.remaining}
                    failures={row.failures}
                    total={row.total}
                    widthPct={(row.total / maxTotal) * 100}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
