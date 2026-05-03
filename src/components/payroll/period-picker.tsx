"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PayrollFrequency } from "@/lib/domain/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthKey(year: number, month0: number) {
  return `${year}-${String(month0 + 1).padStart(2, "0")}`;
}

export function PeriodPicker({
  frequency,
  periodKey,
}: {
  frequency: PayrollFrequency;
  periodKey: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  if (frequency !== "MONTHLY") {
    // For non-monthly frequencies in this demo, show a simple label.
    return (
      <div className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
        {periodKey}
      </div>
    );
  }

  const [yStr, mStr] = periodKey.split("-");
  const year = Number(yStr);
  const month0 = Number(mStr) - 1;

  function navigate(delta: number) {
    const d = new Date(year, month0 + delta, 1);
    const next = monthKey(d.getFullYear(), d.getMonth());
    const newParams = new URLSearchParams(params);
    newParams.set("period", next);
    router.push(`/payroll?${newParams.toString()}`);
  }

  function jumpTo(year: number, month0: number) {
    const next = monthKey(year, month0);
    const newParams = new URLSearchParams(params);
    newParams.set("period", next);
    router.push(`/payroll?${newParams.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white">
      <button
        onClick={() => navigate(-1)}
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <select
        value={month0}
        onChange={(e) => jumpTo(year, Number(e.target.value))}
        className="h-8 border-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => jumpTo(Number(e.target.value), month0)}
        className="h-8 border-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
      >
        {[2024, 2025, 2026, 2027].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <button
        onClick={() => navigate(1)}
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:bg-slate-50"
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
