import { CalendarOffIcon, TriangleAlertIcon } from "lucide-react";

import { fetchAllTasks } from "@/lib/clickup/client";
import { buildReport, type Report } from "@/lib/report";
import {
  InvalidDateError,
  InvalidRangeError,
  currentMonthRange,
  parseDayRange,
  todayInRiyadh,
} from "@/lib/date-range";
import { formatRange } from "@/lib/format";
import { DelegateTable } from "@/components/dashboard/delegate-table";
import { RangePicker } from "@/components/dashboard/range-picker";
import { ReportSummary } from "@/components/dashboard/report-summary";

/*
 * The dashboard is a card inside a ClickUp iframe, not a page someone browses
 * to. That shapes everything below: no hero, no navigation, and the range in
 * the URL so the embed card can be configured to open on a fixed period.
 *
 * Data is read directly here rather than through /api/report — this component
 * already runs on the server, so an HTTP round-trip to our own origin would
 * only add latency and a second failure mode. The route stays for external use.
 */

function Notice({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof TriangleAlertIcon;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <Icon className="mx-auto size-7 text-muted-foreground/60" aria-hidden />
      <p className="mt-4 font-heading font-medium">{title}</p>
      {children ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</p>
      ) : null}
    </div>
  );
}

function Footnotes({ meta }: { meta: Report["meta"] }) {
  const notes: string[] = [];

  if (meta.multiAssigned > 0) {
    notes.push(
      `${meta.multiAssigned} من الزيارات مُسندة لأكثر من مندوب وتُحتسب لكل منهم، ` +
        `لذلك مجموع صفوف الجدول ${meta.assignments} بينما عدد الزيارات ${meta.inRange}.`,
    );
  }
  if (meta.datedByFallback > 0) {
    notes.push(
      `${meta.datedByFallback} من الزيارات بلا تاريخ استحقاق، أُدرجت حسب تاريخ الإنشاء.`,
    );
  }
  if (meta.unassigned > 0) {
    notes.push(`${meta.unassigned} من الزيارات غير مُسندة لأي مندوب.`);
  }

  if (notes.length === 0) return null;

  return (
    <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
      {notes.map((note) => (
        <li key={note} className="flex gap-2">
          <span aria-hidden className="text-muted-foreground/50">
            •
          </span>
          <span>{note}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const fromParam = first(params.from);
  const toParam = first(params.to);
  const secret = first(params.k) ?? null;

  let range;
  let rangeError: string | null = null;
  try {
    range =
      fromParam && toParam ? parseDayRange(fromParam, toParam) : currentMonthRange();
  } catch (cause) {
    range = currentMonthRange();
    rangeError =
      cause instanceof InvalidRangeError
        ? "تاريخ البداية بعد تاريخ النهاية، لذلك يعرض التقرير الشهر الحالي."
        : cause instanceof InvalidDateError
          ? "تعذّرت قراءة الفترة المطلوبة، لذلك يعرض التقرير الشهر الحالي."
          : null;
    if (rangeError === null) throw cause;
  }

  let report: Report | null = null;
  let loadError = false;
  try {
    report = buildReport(await fetchAllTasks(), range);
  } catch (cause) {
    console.error("[dashboard]", cause);
    loadError = true;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">تقرير المناديب </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            شركة النخيل السبع التجارية — أداء المناديب
          </p>
        </div>

        <RangePicker
          from={range.from}
          to={range.to}
          secret={secret}
          today={todayInRiyadh()}
        />
      </header>

      {rangeError ? (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          {rangeError}
        </p>
      ) : null}

      {loadError ? (
        <Notice icon={TriangleAlertIcon} title="تعذّر تحميل البيانات من ClickUp">
          تحقّق من الاتصال ثم أعد تحميل الصفحة. إذا تكرّر الخطأ، راجع سجلّ الخادم.
        </Notice>
      ) : report && report.meta.inRange === 0 ? (
        <Notice icon={CalendarOffIcon} title="لا توجد زيارات في هذه الفترة">
          لم تُسجَّل أي زيارة بين {formatRange(range.from, range.to)}. جرّب فترة أوسع من
          زرّ التاريخ بالأعلى.
        </Notice>
      ) : report ? (
        <>
          <ReportSummary meta={report.meta} />
          <div className="rounded-xl border bg-card shadow-xs">
            <DelegateTable rows={report.rows} />
          </div>
          <Footnotes meta={report.meta} />
        </>
      ) : null}
    </main>
  );
}
