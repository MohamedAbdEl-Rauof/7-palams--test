import { ClickUpApiError, fetchAllTasks } from "@/lib/clickup/client";
import { MissingEnvError } from "@/lib/clickup/env";
import { UnmappedStatusError } from "@/lib/clickup/status";
import {
  InvalidDateError,
  InvalidRangeError,
  currentMonthRange,
  parseDayRange,
} from "@/lib/date-range";
import { buildReport } from "@/lib/report";

/*
 * GET /api/report?from=yyyy-MM-dd&to=yyyy-MM-dd
 *
 * Returns one row per assignee with the four metrics. Both params are optional;
 * omitting them reports the current month in Riyadh. Route Handlers are not
 * cached by default in Next 16, and this one reads the request URL anyway, so
 * no cache opt-out is needed.
 *
 * NOTE: this route is currently unauthenticated. The DASHBOARD_SECRET gate and
 * the frame-ancestors CSP header belong to the embedding phase — a deliberate
 * deferral, not an oversight.
 */

function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if ((from === null) !== (to === null)) {
    return error(400, "يجب تحديد التاريخين معًا: from و to، أو تركهما فارغين.");
  }

  let range;
  try {
    range = from !== null && to !== null ? parseDayRange(from, to) : currentMonthRange();
  } catch (cause) {
    if (cause instanceof InvalidDateError) {
      return error(400, "صيغة التاريخ غير صحيحة. الصيغة المطلوبة yyyy-MM-dd.");
    }
    if (cause instanceof InvalidRangeError) {
      return error(400, "تاريخ البداية يجب أن يسبق تاريخ النهاية.");
    }
    throw cause;
  }

  try {
    const report = buildReport(await fetchAllTasks(), range);
    return Response.json(report);
  } catch (cause) {
    // Log the detail server-side; the response stays generic so nothing about
    // the workspace or the token surfaces to the browser.
    console.error("[api/report]", cause);

    if (cause instanceof MissingEnvError) {
      return error(500, "إعدادات الخادم غير مكتملة.");
    }
    if (cause instanceof UnmappedStatusError) {
      return error(500, `حالة غير معروفة في ClickUp: «${cause.status}».`);
    }
    if (cause instanceof ClickUpApiError) {
      return error(502, "تعذر الاتصال بـ ClickUp. حاول مرة أخرى.");
    }
    return error(500, "حدث خطأ غير متوقع.");
  }
}
