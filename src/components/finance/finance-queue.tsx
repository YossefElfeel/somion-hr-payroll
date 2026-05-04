"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { RunStateBadge } from "@/components/payroll/run-state-badge";
import { StatusBadge } from "@/components/payroll/status-badge";
import { markBulkPaid } from "@/lib/actions";
import { computeTotals, formatCHF } from "@/lib/domain/totals";
import type {
  Bonus,
  Deduction,
  Employee,
  PayrollRun,
  RunItem,
} from "@/lib/domain/types";

interface Group {
  run: PayrollRun;
  items: { it: RunItem; emp: Employee; bonuses: Bonus[]; deductions: Deduction[] }[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function periodKey(year: number, month0: number) {
  return `${year}-${String(month0 + 1).padStart(2, "0")}`;
}

export function FinanceQueue({ groups }: { groups: Group[] }) {
  // Filter is either "all months" or a specific {year, month0}. Default to all
  // so finance sees their full pending workload on first load.
  const [filterAll, setFilterAll] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());

  const visible = useMemo(() => {
    if (filterAll) return groups;
    const k = periodKey(year, month0);
    // For monthly runs the periodKey matches exactly. For non-monthly runs
    // (biweekly, weekly), the periodKey starts with the YYYY-MM prefix.
    return groups.filter((g) => g.run.periodKey.startsWith(k));
  }, [groups, filterAll, year, month0]);

  function navigate(delta: number) {
    setFilterAll(false);
    const d = new Date(year, month0 + delta, 1);
    setYear(d.getFullYear());
    setMonth0(d.getMonth());
  }

  // Year options: cover seeded data + a couple years on either side of "now".
  const years = useMemo(() => {
    const set = new Set<number>([now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]);
    for (const g of groups) {
      const y = Number(g.run.periodKey.slice(0, 4));
      if (!Number.isNaN(y)) set.add(y);
    }
    return [...set].sort();
  }, [groups, now]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Period</span>
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
            onChange={(e) => {
              setFilterAll(false);
              setMonth0(Number(e.target.value));
            }}
            className="h-8 border-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => {
              setFilterAll(false);
              setYear(Number(e.target.value));
            }}
            className="h-8 border-0 bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
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
        <button
          onClick={() => setFilterAll(true)}
          className={
            filterAll
              ? "rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
              : "rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          }
        >
          All months ({groups.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          {filterAll
            ? "No pending payments."
            : `No payments for ${MONTH_NAMES[month0]} ${year}.`}
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map((g) => (
            <RunGroup key={g.run.id} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function RunGroup({ group }: { group: Group }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const queueItems = group.items.filter((x) => x.it.status === "IN_FINANCE_QUEUE");
  const queueIds = queueItems.map((x) => x.emp.id);
  const allChecked = queueIds.length > 0 && queueIds.every((id) => selected.has(id));
  const selectedQueueRows = queueItems.filter((x) => selected.has(x.emp.id));

  const totalToPay = queueItems.reduce(
    (s, x) => s + computeTotals(x.emp, x.bonuses, x.deductions).total,
    0,
  );
  const selectedTotal = selectedQueueRows.reduce(
    (s, x) => s + computeTotals(x.emp, x.bonuses, x.deductions).total,
    0,
  );

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(queueIds));
  }
  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function payIds(ids: string[]) {
    if (ids.length === 0) return;
    startTransition(async () => {
      await markBulkPaid(group.run.id, ids);
      setSelected(new Set());
    });
  }

  function exportCsv() {
    const rows = group.items.map((x) => {
      const t = computeTotals(x.emp, x.bonuses, x.deductions);
      return {
        name: x.emp.name,
        iban: x.emp.bank.iban,
        amount: t.total,
        status: x.it.status,
      };
    });
    const csv = [
      "Name,IBAN,Amount,Status",
      ...rows.map((r) => `${r.name},${r.iban},${r.amount},${r.status}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${group.run.periodKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {group.run.periodLabel}
            </h3>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{group.run.frequency}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <RunStateBadge state={group.run.state} />
            <span>
              {queueItems.length} pending · {formatCHF(totalToPay)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download size={14} /> Export bank file
          </Button>
          {selectedQueueRows.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() => payIds(selectedQueueRows.map((x) => x.emp.id))}
              title={`Pay ${selectedQueueRows.length} selected (${formatCHF(selectedTotal)})`}
            >
              <CreditCard size={14} /> Pay selected ({selectedQueueRows.length})
            </Button>
          )}
          {queueItems.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() => payIds(queueIds)}
              title={`Pay all ${queueItems.length} pending (${formatCHF(totalToPay)})`}
            >
              <CheckCircle2 size={14} /> Pay all ({queueItems.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="w-10 px-4 py-3 text-left">
                {queueItems.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    title="Select all pending"
                  />
                )}
              </th>
              <th className="px-4 py-3 text-left font-medium">Employee</th>
              <th className="px-4 py-3 text-left font-medium">IBAN</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {group.items.map(({ it, emp, bonuses, deductions }) => {
              const t = computeTotals(emp, bonuses, deductions);
              const inQueue = it.status === "IN_FINANCE_QUEUE";
              return (
                <tr key={it.id}>
                  <td className="px-4 py-3">
                    {inQueue && (
                      <input
                        type="checkbox"
                        checked={selected.has(emp.id)}
                        onChange={() => toggle(emp.id)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{emp.name}</div>
                    <div className="text-xs text-slate-500">{emp.department}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {emp.bank.iban}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatCHF(t.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={it.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {inQueue && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => payIds([emp.id])}
                        >
                          <CheckCircle2 size={14} /> Mark paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
