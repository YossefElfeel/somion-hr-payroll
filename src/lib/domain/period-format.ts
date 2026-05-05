// Shared formatter for payroll periodKeys. Single source of truth so the
// picker, the empty state, the Start-run button, and the run-list cards all
// say exactly the same thing.

import {
  format as fmt,
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  setISOWeek,
  startOfYear,
} from "date-fns";
import type { PayrollFrequency } from "./types";

export function formatPeriodLabel(
  frequency: PayrollFrequency,
  periodKey: string,
): string {
  if (frequency === "MONTHLY") {
    const m = /^(\d{4})-(\d{2})$/.exec(periodKey);
    if (!m) return periodKey;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
    return fmt(d, "MMMM yyyy");
  }

  if (frequency === "BIWEEKLY") {
    const m = /^(\d{4})-(\d{2})([AB])$/.exec(periodKey);
    if (!m) return periodKey;
    const year = Number(m[1]);
    const month0 = Number(m[2]) - 1;
    const half = m[3] as "A" | "B";
    const start = half === "A" ? new Date(year, month0, 1) : new Date(year, month0, 15);
    const end =
      half === "A"
        ? new Date(year, month0, 14)
        : new Date(year, month0 + 1, 0);
    return `${fmt(start, "MMM d")} – ${fmt(end, "d, yyyy")}`;
  }

  if (frequency === "WEEKLY") {
    const m = /^(\d{4})-W(\d{1,2})$/.exec(periodKey);
    if (!m) return periodKey;
    const year = Number(m[1]);
    const week = Number(m[2]);
    const inside = setISOWeek(startOfYear(new Date(year, 0, 4)), week);
    const start = startOfISOWeek(inside);
    const end = endOfISOWeek(inside);
    return `Week ${week} · ${fmt(start, "MMM d")} – ${fmt(end, "d, yyyy")}`;
  }

  // HOURLY
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(periodKey);
  if (!m) return periodKey;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return fmt(d, "MMMM d, yyyy");
}

// Lower-case unit name used in copy ("No run for this {unit}.").
export function periodUnitLabel(frequency: PayrollFrequency): string {
  return {
    MONTHLY: "month",
    BIWEEKLY: "half-month",
    WEEKLY: "week",
    HOURLY: "day",
  }[frequency];
}

// Compute the current period for a given frequency. Used as the default
// when no period is in the URL.
export function currentPeriodKey(
  frequency: PayrollFrequency,
  now: Date = new Date(),
): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  if (frequency === "MONTHLY") return `${y}-${m}`;
  if (frequency === "BIWEEKLY") return `${y}-${m}${now.getDate() <= 14 ? "A" : "B"}`;
  if (frequency === "WEEKLY") {
    const week = getISOWeek(now);
    // Use the ISO week-numbering year (handles Dec/Jan boundary).
    const inside = now;
    const isoYear = fmt(inside, "RRRR");
    return `${isoYear}-W${String(week).padStart(2, "0")}`;
  }
  // HOURLY
  return `${y}-${m}-${String(now.getDate()).padStart(2, "0")}`;
}
