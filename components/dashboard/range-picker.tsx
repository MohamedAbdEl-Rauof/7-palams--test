"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { arSA } from "date-fns/locale";
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRange, parseDay, toDay } from "@/lib/format";

export interface RangePickerProps {
  from: string;
  to: string;
  /** The URL key, preserved across navigation or the next request is rejected. */
  secret: string | null;
  /**
   * Today in Riyadh, resolved on the server. The presets must not be derived
   * from the browser clock — a viewer in another timezone would otherwise get
   * a different "هذا الشهر" than the server uses to filter.
   */
  today: string;
}

/*
 * date-fns renders full Arabic weekday names (الأحد، الاثنين، الثلاثاء…) which
 * collide in a 28px calendar cell and run together into an unreadable strip.
 * Arabic calendars conventionally abbreviate to a single letter, so use that.
 */
const WEEKDAY_INITIALS = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

function formatWeekdayName(weekday: Date): string {
  return WEEKDAY_INITIALS[weekday.getDay()];
}

export function RangePicker({ from, to, secret, today }: RangePickerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState<DateRange | undefined>({
    from: parseDay(from),
    to: parseDay(to),
  });

  const now = parseDay(today);

  const presets = [
    { label: "هذا الشهر", from: startOfMonth(now), to: endOfMonth(now) },
    {
      label: "الشهر الماضي",
      from: startOfMonth(subMonths(now, 1)),
      to: endOfMonth(subMonths(now, 1)),
    },
    { label: "آخر 30 يومًا", from: subDays(now, 29), to: now },
    { label: "هذا العام", from: startOfYear(now), to: endOfYear(now) },
  ];

  function apply(nextFrom: Date, nextTo: Date) {
    const params = new URLSearchParams({ from: toDay(nextFrom), to: toDay(nextTo) });
    if (secret) params.set("k", secret);
    setOpen(false);
    startTransition(() => router.push(`/?${params}`));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal" disabled={pending}>
          {pending ? (
            <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
          ) : (
            <CalendarIcon className="size-4 opacity-70" aria-hidden />
          )}
          <span className="tabular-nums">{formatRange(from, to)}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row-reverse">
          <Calendar
            mode="range"
            dir="rtl"
            locale={arSA}
            numberOfMonths={2}
            defaultMonth={parseDay(from)}
            selected={draft}
            onSelect={setDraft}
            formatters={{ formatWeekdayName }}
            // Leading/trailing days belong to a neighbouring month and picked up
            // the in-range background even when that month sat outside the
            // range, which read as a selection the user had not made.
            showOutsideDays={false}
            className="p-3"
          />

          <div className="flex flex-row flex-wrap gap-1 border-t p-3 sm:w-40 sm:flex-col sm:border-e sm:border-t-0">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => apply(preset.from, preset.to)}
              >
                {preset.label}
              </Button>
            ))}

            <div className="mt-auto hidden w-full pt-3 sm:block">
              <Button
                size="sm"
                className="w-full"
                disabled={!draft?.from || !draft?.to}
                onClick={() => {
                  if (draft?.from && draft?.to) apply(draft.from, draft.to);
                }}
              >
                عرض التقرير
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t p-3 sm:hidden">
          <Button
            size="sm"
            className="w-full"
            disabled={!draft?.from || !draft?.to}
            onClick={() => {
              if (draft?.from && draft?.to) apply(draft.from, draft.to);
            }}
          >
            عرض التقرير
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
