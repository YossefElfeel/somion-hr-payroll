import { AppShell } from "@/components/shell/app-shell";
import { FrequencyTabs } from "@/components/payroll/frequency-tabs";
import { PeriodPicker } from "@/components/payroll/period-picker";
import { OverviewTable } from "@/components/payroll/overview-table";
import { StartRunButton } from "@/components/payroll/start-run-button";
import { db } from "@/lib/domain/store";
import type { PayrollFrequency } from "@/lib/domain/types";
import Link from "next/link";

interface SearchParams {
  freq?: string;
  period?: string;
}

function defaultPeriod(freq: PayrollFrequency) {
  if (freq === "MONTHLY") return "2026-04";
  if (freq === "BIWEEKLY") return "2026-04A";
  if (freq === "WEEKLY") return "2026-W17";
  return "2026-04";
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const freq = (sp.freq as PayrollFrequency) ?? "MONTHLY";
  const period = sp.period ?? defaultPeriod(freq);

  const run = db.getRunByPeriod(freq, period);
  const allEmployees = db.listEmployees().filter((e) => e.payrollFrequency === freq);
  // Loans for the employees on this frequency. We show every active loan for
  // anyone in this frequency so the Loans tab is always meaningful, regardless
  // of which run is currently selected.
  const empIds = new Set(allEmployees.map((e) => e.id));
  const loans = db.listLoans().filter((l) => empIds.has(l.employeeId));

  return (
    <AppShell title="Payroll">
      <div className="mx-auto w-full px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Payroll
            </h1>
            <p className="text-xs text-slate-500">
              Bonuses, deductions, loans, and the approval-to-payment cycle.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FrequencyTabs active={freq} />
            <PeriodPicker frequency={freq} periodKey={period} />
          </div>
        </div>

        {!run && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-base font-semibold text-slate-900">
              No payroll run for this period
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {freq === "MONTHLY"
                ? `No run exists for ${formatPeriod(period)}.`
                : `No run exists for ${period}.`}
              {" "}{allEmployees.length} employees on this frequency.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              In production, an OPEN run is auto-created on the 1st of each period.
              You can also start one manually:
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <StartRunButton
                frequency={freq}
                periodKey={period}
                periodLabel={
                  freq === "MONTHLY" ? formatPeriod(period) : period
                }
              />
              <Link
                href="/payroll?freq=MONTHLY&period=2026-04"
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                or go to April 2026 →
              </Link>
            </div>
          </div>
        )}

        {run && (
          <OverviewTable
            run={run}
            employees={allEmployees}
            items={db.listRunItems(run.id)}
            bonuses={db.listBonuses(run.id)}
            deductions={db.listDeductions(run.id)}
            loans={loans}
          />
        )}
      </div>
    </AppShell>
  );
}

function formatPeriod(periodKey: string) {
  const [y, m] = periodKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
