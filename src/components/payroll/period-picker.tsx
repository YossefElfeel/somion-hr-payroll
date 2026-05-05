"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format as fmt,
  addMonths,
  addWeeks,
  addDays,
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  setISOWeek,
  startOfYear,
} from "date-fns";
import type { PayrollFrequency } from "@/lib/domain/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// PeriodKey formats — must match what the rest of the app produces:
//   MONTHLY  → "YYYY-MM"
//   BIWEEKLY → "YYYY-MM[A|B]" (A = day 1–14, B = day 15–end)
//   WEEKLY   → "YYYY-Www" (ISO week, e.g. "2026-W17")
//   HOURLY   → "YYYY-MM-DD" (single day, since hourly is on-demand)
//
// The picker reads + writes that key via the URL ?period= query param. Each
// frequency gets the same chevron-stepper layout so they look consistent.

export function PeriodPicker({
  frequency,
  periodKey,
}: {
  frequency: PayrollFrequency;
  periodKey: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(nextKey: string) {
    const newParams = new URLSearchParams(params);
    newParams.set("period", nextKey);
    router.push(`/payroll?${newParams.toString()}`);
  }

  if (frequency === "MONTHLY") {
    return (
      <MonthlyPicker periodKey={periodKey} onChange={go} />
    );
  }
  if (frequency === "BIWEEKLY") {
    return <BiweeklyPicker periodKey={periodKey} onChange={go} />;
  }
  if (frequency === "WEEKLY") {
    return <WeeklyPicker periodKey={periodKey} onChange={go} />;
  }
  return <HourlyPicker periodKey={periodKey} onChange={go} />;
}

// ---------- shared chrome ----------

function PickerShell({
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  children,
}: {
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white">
      <button
        onClick={onPrev}
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        aria-label={prevLabel}
      >
        <ChevronLeft size={16} />
      </button>
      {children}
      <button
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        aria-label={nextLabel}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ---------- monthly ----------

function MonthlyPicker({
  periodKey,
  onChange,
}: {
  periodKey: string;
  onChange: (k: string) => void;
}) {
  const [yStr, mStr] = periodKey.split("-");
  const year = Number(yStr);
  const month0 = Number(mStr) - 1;
  const valid = Number.isFinite(year) && month0 >= 0 && month0 < 12;
  const safeYear = valid ? year : new Date().getFullYear();
  const safeMonth0 = valid ? month0 : new Date().getMonth();

  function step(delta: number) {
    const d = addMonths(new Date(safeYear, safeMonth0, 1), delta);
    onChange(fmt(d, "yyyy-MM"));
  }
  function jump(y: number, m0: number) {
    onChange(fmt(new Date(y, m0, 1), "yyyy-MM"));
  }

  return (
    <PickerShell
      prevLabel="Previous month"
      nextLabel="Next month"
      onPrev={() => step(-1)}
      onNext={() => step(1)}
    >
      <select
        value={safeMonth0}
        onChange={(e) => jump(safeYear, Number(e.target.value))}
        className="h-8 border-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i}>{m}</option>
        ))}
      </select>
      <select
        value={safeYear}
        onChange={(e) => jump(Number(e.target.value), safeMonth0)}
        className="h-8 border-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
      >
        {[2024, 2025, 2026, 2027, 2028].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </PickerShell>
  );
}

// ---------- biweekly ----------

function BiweeklyPicker({
  periodKey,
  onChange,
}: {
  periodKey: string;
  onChange: (k: string) => void;
}) {
  // "2026-04A" → year 2026, month0 3, half "A"
  const m = /^(\d{4})-(\d{2})([AB])$/.exec(periodKey);
  const now = new Date();
  const year = m ? Number(m[1]) : now.getFullYear();
  const month0 = m ? Number(m[2]) - 1 : now.getMonth();
  const half: "A" | "B" = m ? (m[3] as "A" | "B") : now.getDate() <= 14 ? "A" : "B";

  function key(y: number, mo: number, h: "A" | "B") {
    return `${fmt(new Date(y, mo, 1), "yyyy-MM")}${h}`;
  }
  function step(delta: number) {
    let nh = half;
    let nm = month0;
    let ny = year;
    if (delta > 0) {
      if (nh === "A") nh = "B";
      else { nh = "A"; const d = addMonths(new Date(ny, nm, 1), 1); ny = d.getFullYear(); nm = d.getMonth(); }
    } else {
      if (nh === "B") nh = "A";
      else { nh = "B"; const d = addMonths(new Date(ny, nm, 1), -1); ny = d.getFullYear(); nm = d.getMonth(); }
    }
    onChange(key(ny, nm, nh));
  }

  // Last day of the half: A always ends day 14; B ends on the last of month.
  const start = half === "A" ? new Date(year, month0, 1) : new Date(year, month0, 15);
  const end =
    half === "A"
      ? new Date(year, month0, 14)
      : new Date(year, month0 + 1, 0);
  const label = `${fmt(start, "MMM d")} – ${fmt(end, "d, yyyy")}`;

  return (
    <PickerShell
      prevLabel="Previous half-month"
      nextLabel="Next half-month"
      onPrev={() => step(-1)}
      onNext={() => step(1)}
    >
      <span className="px-3 text-sm font-medium text-slate-700 whitespace-nowrap">
        {label}
      </span>
    </PickerShell>
  );
}

// ---------- weekly ----------

function WeeklyPicker({
  periodKey,
  onChange,
}: {
  periodKey: string;
  onChange: (k: string) => void;
}) {
  // "2026-W17" → year 2026, isoWeek 17
  const m = /^(\d{4})-W(\d{1,2})$/.exec(periodKey);
  const now = new Date();
  const year = m ? Number(m[1]) : now.getFullYear();
  const week = m ? Number(m[2]) : getISOWeek(now);

  // Build the Date that sits inside the chosen ISO week so we can step by
  // calendar weeks reliably (handles year boundaries automatically).
  const inside = setISOWeek(startOfYear(new Date(year, 0, 4)), week);

  function step(delta: number) {
    const next = addWeeks(inside, delta);
    onChange(`${fmt(next, "yyyy")}-W${String(getISOWeek(next)).padStart(2, "0")}`);
  }

  const start = startOfISOWeek(inside);
  const end = endOfISOWeek(inside);
  const label = `Week ${week} · ${fmt(start, "MMM d")} – ${fmt(end, "d, yyyy")}`;

  return (
    <PickerShell
      prevLabel="Previous week"
      nextLabel="Next week"
      onPrev={() => step(-1)}
      onNext={() => step(1)}
    >
      <span className="px-3 text-sm font-medium text-slate-700 whitespace-nowrap">
        {label}
      </span>
    </PickerShell>
  );
}

// ---------- hourly ----------

function HourlyPicker({
  periodKey,
  onChange,
}: {
  periodKey: string;
  onChange: (k: string) => void;
}) {
  // "2026-05-05" — single calendar day.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(periodKey);
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();

  function step(delta: number) {
    const next = addDays(date, delta);
    onChange(fmt(next, "yyyy-MM-dd"));
  }

  return (
    <PickerShell
      prevLabel="Previous day"
      nextLabel="Next day"
      onPrev={() => step(-1)}
      onNext={() => step(1)}
    >
      <input
        type="date"
        value={fmt(date, "yyyy-MM-dd")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 border-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
      />
    </PickerShell>
  );
}
