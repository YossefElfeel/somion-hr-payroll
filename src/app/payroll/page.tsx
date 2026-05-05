import { AppShell } from "@/components/shell/app-shell";
import { FrequencyTabs } from "@/components/payroll/frequency-tabs";
import { PeriodPicker } from "@/components/payroll/period-picker";
import { OverviewTable } from "@/components/payroll/overview-table";
import { StartRunButton } from "@/components/payroll/start-run-button";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";
import {
  currentPeriodKey,
  formatPeriodLabel,
  periodUnitLabel,
} from "@/lib/domain/period-format";
import type { PayrollFrequency } from "@/lib/domain/types";
import Link from "next/link";

interface SearchParams {
  freq?: string;
  period?: string;
}

// Default period when no ?period= is in the URL — delegates to the shared
// helper so the picker, defaults, and labels never drift.
function defaultPeriod(freq: PayrollFrequency) {
  return currentPeriodKey(freq);
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await loadStore();
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

  // Latest run-level note from admin (the optional textarea on the approval
  // review screen). Surface as a banner so HR sees admin's general comments,
  // not just the per-row flag notes which already render on each row.
  const latestAdminNote = run
    ? [...db.listAudit(run.id)]
        .reverse()
        .find((a) => a.actor === "ADMIN" && a.note?.trim())
    : null;

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
              No payroll run for this {periodUnitLabel(freq)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              No run exists for{" "}
              <span className="font-medium text-slate-700">
                {formatPeriodLabel(freq, period)}
              </span>
              .{" "}
              {allEmployees.length === 0
                ? `No employees are on the ${freq.toLowerCase()} frequency yet.`
                : `${allEmployees.length} ${
                    allEmployees.length === 1 ? "employee" : "employees"
                  } on this frequency.`}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              In production, an OPEN run is auto-created at the start of each{" "}
              {periodUnitLabel(freq)}. You can also start one manually:
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <StartRunButton
                frequency={freq}
                periodKey={period}
                periodLabel={formatPeriodLabel(freq, period)}
              />
              {freq !== "MONTHLY" && (
                <Link
                  href="/payroll?freq=MONTHLY"
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  or switch to monthly →
                </Link>
              )}
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
            latestAdminNote={
              latestAdminNote
                ? {
                    note: latestAdminNote.note!,
                    actorName: latestAdminNote.actorName,
                    at: latestAdminNote.at,
                  }
                : null
            }
          />
        )}
      </div>
    </AppShell>
  );
}

