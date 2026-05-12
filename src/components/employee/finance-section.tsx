"use client";

import { useState } from "react";
import type { Bonus, Deduction, Loan, PayrollRun, RunItem } from "@/lib/domain/types";
import { EmployeeSection } from "./section";

type Tab = "payroles" | "bonus" | "deductions" | "loans";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  runs: PayrollRun[];
  items: RunItem[];
  bonuses: Bonus[];
  deductions: Deduction[];
  loans: Loan[];
  basicSalary: number;
}

// Cross-run financial view for one employee. Each tab is a slice of the same
// dataset — Payroles aggregates per run, Bonus/Deductions list every line
// ever issued, Loans summarises outstanding balances.
export function FinanceSection({
  runs,
  items,
  bonuses,
  deductions,
  loans,
  basicSalary,
}: Props) {
  const [tab, setTab] = useState<Tab>("payroles");

  return (
    <EmployeeSection
      title="Finance"
      action={
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-0.5 text-xs">
          {(["payroles", "bonus", "deductions", "loans"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-2 py-1 capitalize ${
                tab === t
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "payroles" ? "Payroles" : t}
            </button>
          ))}
        </div>
      }
    >
      {tab === "payroles" && (
        <PayrolesTable
          runs={runs}
          items={items}
          bonuses={bonuses}
          deductions={deductions}
          basicSalary={basicSalary}
        />
      )}
      {tab === "bonus" && <BonusTable bonuses={bonuses} runs={runs} />}
      {tab === "deductions" && <DeductionsTable deductions={deductions} runs={runs} />}
      {tab === "loans" && <LoansTable loans={loans} />}
    </EmployeeSection>
  );
}

function PayrolesTable({
  runs,
  items,
  bonuses,
  deductions,
  basicSalary,
}: {
  runs: PayrollRun[];
  items: RunItem[];
  bonuses: Bonus[];
  deductions: Deduction[];
  basicSalary: number;
}) {
  // Sort runs newest-first by createdAt.
  const sorted = [...runs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (sorted.length === 0) {
    return <Empty>No payroll runs for this employee yet.</Empty>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Base Salary</th>
            <th className="px-3 py-2">Bonus</th>
            <th className="px-3 py-2">Deductions</th>
            <th className="px-3 py-2">Loans</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((run) => {
            const item = items.find((it) => it.runId === run.id);
            const runBonus = bonuses.filter((b) => b.runId === run.id).reduce((s, b) => s + b.amount, 0);
            const runManual = deductions
              .filter((d) => d.runId === run.id && d.source === "MANUAL")
              .reduce((s, d) => s + d.amount, 0);
            const runLoans = deductions
              .filter((d) => d.runId === run.id && d.source !== "MANUAL")
              .reduce((s, d) => s + d.amount, 0);
            const total = basicSalary + runBonus - runManual - runLoans;
            return (
              <tr key={run.id}>
                <td className="px-3 py-2 text-slate-700">
                  {formatDate(run.createdAt)}
                </td>
                <td className="px-3 py-2 text-slate-700">{basicSalary.toLocaleString()} CHF</td>
                <td className="px-3 py-2 text-emerald-700">{runBonus.toLocaleString()} CHF</td>
                <td className="px-3 py-2 text-red-700">{runManual.toLocaleString()} CHF</td>
                <td className="px-3 py-2 text-red-700">{runLoans.toLocaleString()} CHF</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      item?.status === "PAID"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item?.status === "PAID" ? "Approved" : (item?.status ?? "Pending")}
                  </span>
                </td>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {total.toLocaleString()} CHF
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BonusTable({ bonuses, runs }: { bonuses: Bonus[]; runs: PayrollRun[] }) {
  if (bonuses.length === 0) return <Empty>No bonuses issued yet.</Empty>;
  const runById = new Map(runs.map((r) => [r.id, r]));
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Bonus</th>
            <th className="px-3 py-2">Bonus Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bonuses.map((b) => (
            <tr key={b.id}>
              <td className="px-3 py-2 text-slate-700">
                {runById.get(b.runId)?.periodLabel ?? formatDate(b.createdAt)}
              </td>
              <td className="px-3 py-2 font-medium text-emerald-700">
                {b.amount.toLocaleString()} CHF
              </td>
              <td className="px-3 py-2 text-slate-600">{b.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeductionsTable({
  deductions,
  runs,
}: {
  deductions: Deduction[];
  runs: PayrollRun[];
}) {
  const manual = deductions.filter((d) => d.source === "MANUAL");
  if (manual.length === 0) return <Empty>No deductions issued yet.</Empty>;
  const runById = new Map(runs.map((r) => [r.id, r]));
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Deduction</th>
            <th className="px-3 py-2">Deduction Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {manual.map((d) => (
            <tr key={d.id}>
              <td className="px-3 py-2 text-slate-700">
                {runById.get(d.runId)?.periodLabel ?? formatDate(d.createdAt)}
              </td>
              <td className="px-3 py-2 font-medium text-red-700">
                {d.amount.toLocaleString()} CHF
              </td>
              <td className="px-3 py-2 text-slate-600">{d.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoansTable({ loans }: { loans: Loan[] }) {
  if (loans.length === 0) return <Empty>No loans on file.</Empty>;
  return (
    <>
      {loans.map((l) => {
        const remaining = l.totalAmount - l.paidAmount;
        return (
          <div key={l.id} className="mb-4 rounded-lg border border-slate-200 p-4 last:mb-0">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Total loan
                </div>
                <div className="font-semibold text-slate-900">
                  {l.totalAmount.toLocaleString()} CHF
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Paid
                </div>
                <div className="font-semibold text-emerald-700">
                  {l.paidAmount.toLocaleString()} CHF
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Remaining
                </div>
                <div className="font-semibold text-red-700">
                  {remaining.toLocaleString()} CHF
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {l.reason} · {l.monthlyInstallment.toLocaleString()} CHF/month over{" "}
              {l.durationMonths} months
            </div>
          </div>
        );
      })}
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
      {children}
    </p>
  );
}
