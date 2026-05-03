"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PayrollFrequency } from "@/lib/domain/types";

const TABS: { value: PayrollFrequency; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "HOURLY", label: "Hourly" },
];

export function FrequencyTabs({
  active,
  basePath = "/payroll",
}: {
  active: PayrollFrequency;
  basePath?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {TABS.map((t) => {
        const isActive = t.value === active;
        return (
          <Link
            key={t.value}
            href={`${basePath}?freq=${t.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
