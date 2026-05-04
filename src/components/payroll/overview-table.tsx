"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Pencil,
  AlertCircle,
  Plus,
  Snowflake,
  Send,
  RefreshCw,
  CreditCard,
  ChevronRight,
  Trash2,
  Wallet,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { RunStateBadge } from "./run-state-badge";
import { AddBonusModal } from "./add-bonus-modal";
import { AddDeductionModal } from "./add-deduction-modal";
import { AddLoanModal } from "./add-loan-modal";
import { EditLoanModal } from "./edit-loan-modal";
import { AddLoanAmountModal } from "./add-loan-amount-modal";
import { EditBonusModal } from "./edit-bonus-modal";
import { EditDeductionModal } from "./edit-deduction-modal";
import { EmployeeDrawer } from "./employee-drawer";
import { SubmitApprovalModal } from "./submit-approval-modal";
import {
  freezeRun,
  reopenRun,
  paySelected,
  submitForApproval,
  deleteBonus,
  deleteDeduction,
  excludeEmployee,
  resubmitFlagged,
} from "@/lib/actions";
import { computeTotals, formatCHF } from "@/lib/domain/totals";
import { isRowEditable } from "@/lib/domain/state-machine";
import type {
  Bonus,
  Deduction,
  Employee,
  EmployeePaymentStatus,
  Loan,
  PayrollRun,
  RunItem,
} from "@/lib/domain/types";

interface Props {
  run: PayrollRun;
  employees: Employee[];
  items: RunItem[];
  bonuses: Bonus[];
  deductions: Deduction[];
  loans: Loan[];
}

type SubTab = "all" | "bonus" | "deduction" | "loans";

export function OverviewTable({
  run,
  employees,
  items,
  bonuses,
  deductions,
  loans,
}: Props) {
  const [tab, setTab] = useState<SubTab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bonusOpen, setBonusOpen] = useState(false);
  const [deductionOpen, setDeductionOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [addAmountLoan, setAddAmountLoan] = useState<Loan | null>(null);
  const [editBonus, setEditBonus] = useState<Bonus | null>(null);
  const [editDeduction, setEditDeduction] = useState<Deduction | null>(null);
  const [drawerEmployeeId, setDrawerEmployeeId] = useState<string | null>(null);
  // When the drawer triggers Add Bonus / Add Deduction, the modal needs to know
  // which employee was clicked from the drawer so its dropdown is locked.
  const [bonusDefaultEmpId, setBonusDefaultEmpId] = useState<string | undefined>();
  const [deductionDefaultEmpId, setDeductionDefaultEmpId] = useState<string | undefined>();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const employeeById = useMemo(() => {
    const m = new Map<string, Employee>();
    for (const e of employees) m.set(e.id, e);
    return m;
  }, [employees]);

  const itemByEmp = useMemo(() => {
    const m = new Map<string, RunItem>();
    for (const it of items) m.set(it.employeeId, it);
    return m;
  }, [items]);

  const rows = useMemo(
    () =>
      items.map((it) => {
        const emp = employeeById.get(it.employeeId)!;
        const empBonuses = bonuses.filter((b) => b.employeeId === emp.id);
        const empDeductions = deductions.filter((d) => d.employeeId === emp.id);
        const t = computeTotals(emp, empBonuses, empDeductions);
        return { item: it, emp, t, empBonuses, empDeductions };
      }),
    [bonuses, deductions, employeeById, items],
  );

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.item.status] = (acc[r.item.status] ?? 0) + 1;
    return acc;
  }, {});

  // Employees whose row is still editable (DRAFT/CHANGES_NEEDED on OPEN, or
  // CHANGES_NEEDED on FROZEN). Filtering here prevents the modal from letting
  // HR pick someone the server will reject.
  const editableEmployees = rows
    .filter((r) => isRowEditable(run.state, r.item.status))
    .map((r) => r.emp);

  const selectedRows = rows.filter((r) => selected.has(r.emp.id));
  const submittableSelected = selectedRows.filter(
    (r) => r.item.status === "DRAFT" || r.item.status === "CHANGES_NEEDED",
  );
  const payableSelected = selectedRows.filter((r) => r.item.status === "APPROVED");

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const bulkGroup =
    counts.DRAFT || counts.CHANGES_NEEDED
      ? "submit"
      : counts.APPROVED
        ? "pay"
        : null;
  const allSelectableIds = rows
    .filter((r) =>
      bulkGroup === "submit"
        ? r.item.status === "DRAFT" || r.item.status === "CHANGES_NEEDED"
        : bulkGroup === "pay"
          ? r.item.status === "APPROVED"
          : false,
    )
    .map((r) => r.emp.id);
  const allChecked =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(allSelectableIds));
  }

  return (
    <>
      {/* State action bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <RunStateBadge state={run.state} />
          <BannerText counts={counts} state={run.state} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {run.state === "OPEN" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setBonusOpen(true)}>
                <Plus size={14} /> Bonus
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeductionOpen(true)}>
                <Plus size={14} /> Deduction
              </Button>
              <Button size="sm" variant="outline" onClick={() => setLoanOpen(true)}>
                <Plus size={14} /> Loan
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await freezeRun(run.id);
                  })
                }
              >
                <Snowflake size={14} /> Freeze Run
              </Button>
            </>
          )}
          {run.state === "FROZEN" && (
            <>
              {(counts.CHANGES_NEEDED ?? 0) > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await resubmitFlagged(run.id);
                    })
                  }
                  title="Re-submit all flagged rows (status returns to Submitted for admin review)"
                >
                  <Send size={14} /> Re-submit flagged ({counts.CHANGES_NEEDED})
                </Button>
              )}
              {((counts.DRAFT ?? 0) > 0 || (counts.CHANGES_NEEDED ?? 0) > 0) && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await reopenRun(run.id);
                    })
                  }
                  title="Re-open to add or modify bonuses/deductions for unsubmitted or flagged employees"
                >
                  <RefreshCw size={14} /> Re-open
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={submittableSelected.length === 0}
                onClick={() => setSubmitOpen(true)}
              >
                <Send size={14} />
                Submit{" "}
                {submittableSelected.length > 0 && `(${submittableSelected.length})`}
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={payableSelected.length === 0 || pending}
                onClick={() =>
                  startTransition(async () => {
                    await paySelected(run.id, payableSelected.map((r) => r.emp.id));
                    setSelected(new Set());
                  })
                }
              >
                <CreditCard size={14} />
                Pay {payableSelected.length > 0 && `(${payableSelected.length})`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mb-3 flex items-center gap-4 border-b border-slate-200">
        {(["all", "bonus", "deduction", "loans"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "border-b-2 border-brand-600 px-2 py-2 text-sm font-medium text-brand-700"
                : "border-b-2 border-transparent px-2 py-2 text-sm text-slate-500 hover:text-slate-700"
            }
          >
            {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <AllTab
          rows={rows}
          run={run}
          selected={selected}
          allChecked={allChecked}
          allSelectableIds={allSelectableIds}
          bulkGroup={bulkGroup}
          toggle={toggle}
          toggleAll={toggleAll}
          onManage={(empId) => setDrawerEmployeeId(empId)}
        />
      )}
      {tab === "bonus" && (
        <BonusTab
          run={run}
          bonuses={bonuses}
          employeeById={employeeById}
          itemByEmp={itemByEmp}
          onEdit={(b) => setEditBonus(b)}
        />
      )}
      {tab === "deduction" && (
        <DeductionTab
          run={run}
          deductions={deductions}
          employeeById={employeeById}
          itemByEmp={itemByEmp}
          onEdit={(d) => setEditDeduction(d)}
        />
      )}
      {tab === "loans" && (
        <LoansTab
          loans={loans}
          employeeById={employeeById}
          onEdit={(l) => setEditLoan(l)}
          onAddAmount={(l) => setAddAmountLoan(l)}
        />
      )}

      <AddBonusModal
        open={bonusOpen}
        onClose={() => {
          setBonusOpen(false);
          setBonusDefaultEmpId(undefined);
        }}
        runId={run.id}
        employees={editableEmployees}
        defaultEmployeeId={bonusDefaultEmpId}
      />
      <AddDeductionModal
        open={deductionOpen}
        onClose={() => {
          setDeductionOpen(false);
          setDeductionDefaultEmpId(undefined);
        }}
        runId={run.id}
        employees={editableEmployees}
        defaultEmployeeId={deductionDefaultEmpId}
      />
      <AddLoanModal
        open={loanOpen}
        onClose={() => setLoanOpen(false)}
        employees={employees}
        runId={run.id}
      />
      <EditLoanModal
        open={!!editLoan}
        onClose={() => setEditLoan(null)}
        loan={editLoan}
      />
      <AddLoanAmountModal
        open={!!addAmountLoan}
        onClose={() => setAddAmountLoan(null)}
        loan={addAmountLoan}
        runId={run.id}
      />
      <EditBonusModal
        open={!!editBonus}
        onClose={() => setEditBonus(null)}
        runId={run.id}
        bonus={editBonus}
      />
      <EditDeductionModal
        open={!!editDeduction}
        onClose={() => setEditDeduction(null)}
        runId={run.id}
        deduction={editDeduction}
      />
      <EmployeeDrawer
        open={!!drawerEmployeeId}
        onClose={() => setDrawerEmployeeId(null)}
        run={run}
        employee={
          drawerEmployeeId ? (employeeById.get(drawerEmployeeId) ?? null) : null
        }
        item={
          drawerEmployeeId ? (itemByEmp.get(drawerEmployeeId) ?? null) : null
        }
        bonuses={
          drawerEmployeeId
            ? bonuses.filter((b) => b.employeeId === drawerEmployeeId)
            : []
        }
        deductions={
          drawerEmployeeId
            ? deductions.filter((d) => d.employeeId === drawerEmployeeId)
            : []
        }
        loans={
          drawerEmployeeId
            ? loans.filter((l) => l.employeeId === drawerEmployeeId)
            : []
        }
        onAddBonus={() => {
          if (!drawerEmployeeId) return;
          setBonusDefaultEmpId(drawerEmployeeId);
          setBonusOpen(true);
        }}
        onAddDeduction={() => {
          if (!drawerEmployeeId) return;
          setDeductionDefaultEmpId(drawerEmployeeId);
          setDeductionOpen(true);
        }}
        onEditBonus={(b) => setEditBonus(b)}
        onEditDeduction={(d) => setEditDeduction(d)}
        onEditLoan={(l) => setEditLoan(l)}
        onAddLoanAmount={(l) => setAddAmountLoan(l)}
      />
      <SubmitApprovalModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        runId={run.id}
        rows={submittableSelected.map((r) => ({
          employeeId: r.emp.id,
          name: r.emp.name,
          total: r.t.total,
        }))}
        onSubmitted={() => {
          setSelected((prev) => {
            const n = new Set(prev);
            for (const r of submittableSelected) n.delete(r.emp.id);
            return n;
          });
        }}
      />
    </>
  );
}

// ---------- All tab (the main employee table) ----------

function AllTab({
  rows,
  run,
  selected,
  allChecked,
  allSelectableIds,
  bulkGroup,
  toggle,
  toggleAll,
  onManage,
}: {
  rows: ReturnType<typeof buildRowsType>;
  run: PayrollRun;
  selected: Set<string>;
  allChecked: boolean;
  allSelectableIds: string[];
  bulkGroup: "submit" | "pay" | null;
  toggle: (id: string) => void;
  toggleAll: () => void;
  onManage: (employeeId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="w-10 px-4 py-3 text-left">
              {run.state === "FROZEN" && allSelectableIds.length > 0 && (
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  title={
                    bulkGroup === "submit"
                      ? "Select all unsubmitted"
                      : "Select all approved"
                  }
                />
              )}
            </th>
            <th className="px-4 py-3 text-left font-medium">Employee</th>
            <th className="px-4 py-3 text-right font-medium">Basic</th>
            <th className="px-4 py-3 text-right font-medium">Bonus</th>
            <th className="px-4 py-3 text-right font-medium">Deduction</th>
            <th className="px-4 py-3 text-right font-medium">Loan</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ item, emp, t, empBonuses, empDeductions }) => {
            const flagged = item.status === "CHANGES_NEEDED";
            const selectable = canSelect(run.state, item.status);
            return (
              <tr
                key={item.id}
                className={flagged ? "bg-amber-50/60" : "hover:bg-slate-50"}
              >
                <td className="px-4 py-3">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={selected.has(emp.id)}
                      onChange={() => toggle(emp.id)}
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} />
                    <div>
                      <div className="font-medium text-slate-900">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatCHF(t.basicSalary)}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {empBonuses.length > 0 ? (
                    <span title={`${empBonuses.length} bonus${empBonuses.length === 1 ? "" : "es"} · click Manage to edit each`}>
                      {formatCHF(t.bonusTotal)}
                      {empBonuses.length > 1 && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({empBonuses.length})
                        </span>
                      )}
                    </span>
                  ) : (
                    "--"
                  )}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {(() => {
                    const manualCount = empDeductions.filter(
                      (d) => d.source === "MANUAL",
                    ).length;
                    return t.deductionTotal > 0 ? (
                      <span
                        title={`${manualCount} deduction${manualCount === 1 ? "" : "s"} · click Manage to edit each`}
                      >
                        -{formatCHF(t.deductionTotal)}
                        {manualCount > 1 && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({manualCount})
                          </span>
                        )}
                      </span>
                    ) : (
                      "--"
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {(() => {
                    const loanTotal = t.loanInstallmentTotal + t.extraLoanRepaymentTotal;
                    if (loanTotal <= 0) return "--";
                    const loanCount = empDeductions.filter(
                      (d) => d.source === "LOAN_INSTALLMENT" || d.source === "EXTRA_LOAN_REPAYMENT",
                    ).length;
                    return (
                      <span title={`${loanCount} loan line${loanCount === 1 ? "" : "s"}`}>
                        -{formatCHF(loanTotal)}
                        {loanCount > 1 && (
                          <span className="ml-1 text-xs text-slate-400">
                            ({loanCount})
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatCHF(t.total)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                  {flagged && item.changeNote && (
                    <div
                      className="mt-1.5 flex items-start gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-800 max-w-[280px]"
                      title={item.changeNote}
                    >
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span className="leading-snug line-clamp-2">
                        <span className="font-semibold">Admin: </span>
                        {item.changeNote}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === "CHANGES_NEEDED" ? (
                      <button
                        onClick={() => onManage(emp.id)}
                        className="rounded-md bg-orange-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-700"
                        title="Open the drawer to address admin's flagged changes"
                      >
                        Fix this
                      </button>
                    ) : (
                      <button
                        onClick={() => onManage(emp.id)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                        title={
                          item.status === "DRAFT"
                            ? "View and manage this employee's bonuses, deductions, and loans"
                            : "View this employee's salary breakdown (read-only)"
                        }
                      >
                        {item.status === "DRAFT" ? "Manage" : "View"}
                      </button>
                    )}
                    {(item.status === "DRAFT" || item.status === "CHANGES_NEEDED") && (
                      <ExcludeButton runId={run.id} employeeId={emp.id} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="px-4 py-12 text-center text-sm text-slate-500"
              >
                No employees in this run.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Bonus tab ----------

function BonusTab({
  run,
  bonuses,
  employeeById,
  itemByEmp,
  onEdit,
}: {
  run: PayrollRun;
  bonuses: Bonus[];
  employeeById: Map<string, Employee>;
  itemByEmp: Map<string, RunItem>;
  onEdit: (b: Bonus) => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Employee</th>
            <th className="px-4 py-3 text-right font-medium">Bonus</th>
            <th className="px-4 py-3 text-left font-medium">Reason</th>
            <th className="px-4 py-3 text-left font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bonuses.map((b) => {
            const emp = employeeById.get(b.employeeId);
            if (!emp) return null;
            const item = itemByEmp.get(b.employeeId);
            const editable = item ? isRowEditable(run.state, item.status) : false;
            return (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} />
                    <span className="font-medium text-slate-900">{emp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-emerald-700">
                  +{formatCHF(b.amount)}
                </td>
                <td className="px-4 py-3 text-slate-600">{b.reason}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(b.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {editable ? (
                      <>
                        <button
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                          onClick={() => onEdit(b)}
                          aria-label="Edit bonus"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await deleteBonus(run.id, b.id);
                            })
                          }
                          aria-label="Delete bonus"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <span
                        className="text-slate-300"
                        title={
                          run.state !== "OPEN"
                            ? "Run must be OPEN to edit"
                            : "Employee already submitted/approved/paid"
                        }
                      >
                        <ChevronRight size={14} />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {bonuses.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-12 text-center text-sm text-slate-500"
              >
                No bonuses added in this run yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Deduction tab ----------

function DeductionTab({
  run,
  deductions,
  employeeById,
  itemByEmp,
  onEdit,
}: {
  run: PayrollRun;
  deductions: Deduction[];
  employeeById: Map<string, Employee>;
  itemByEmp: Map<string, RunItem>;
  onEdit: (d: Deduction) => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Employee</th>
            <th className="px-4 py-3 text-right font-medium">Deduction</th>
            <th className="px-4 py-3 text-left font-medium">Reason</th>
            <th className="px-4 py-3 text-left font-medium">Source</th>
            <th className="px-4 py-3 text-left font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {deductions.map((d) => {
            const emp = employeeById.get(d.employeeId);
            if (!emp) return null;
            const auto = d.source !== "MANUAL";
            return (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} />
                    <span className="font-medium text-slate-900">{emp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-red-700">
                  -{formatCHF(d.amount)}
                </td>
                <td className="px-4 py-3 text-slate-600">{d.reason}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      auto
                        ? "rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    }
                  >
                    {d.source === "LOAN_INSTALLMENT"
                      ? "Loan auto"
                      : d.source === "EXTRA_LOAN_REPAYMENT"
                        ? "Loan extra"
                        : "Manual"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(d.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {(() => {
                      const item = itemByEmp.get(d.employeeId);
                      const editable =
                        d.source === "MANUAL" &&
                        item != null &&
                        isRowEditable(run.state, item.status);
                      if (!editable) {
                        return (
                          <span
                            className="text-slate-300"
                            title={
                              auto
                                ? "Loan deductions are managed via the Loans tab"
                                : run.state !== "OPEN"
                                  ? "Run must be OPEN to edit"
                                  : "Employee already submitted/approved/paid"
                            }
                          >
                            <ChevronRight size={14} />
                          </span>
                        );
                      }
                      return (
                        <>
                          <button
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                            onClick={() => onEdit(d)}
                            aria-label="Edit deduction"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await deleteDeduction(run.id, d.id);
                              })
                            }
                            aria-label="Delete deduction"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            );
          })}
          {deductions.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-12 text-center text-sm text-slate-500"
              >
                No deductions added in this run yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Loans tab ----------

function LoansTab({
  loans,
  employeeById,
  onEdit,
  onAddAmount,
}: {
  loans: Loan[];
  employeeById: Map<string, Employee>;
  onEdit: (l: Loan) => void;
  onAddAmount: (l: Loan) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Employee</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 text-right font-medium">Paid</th>
            <th className="px-4 py-3 text-right font-medium">Remaining</th>
            <th className="px-4 py-3 text-right font-medium">Monthly</th>
            <th className="px-4 py-3 text-left font-medium">Reason</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loans.map((l) => {
            const emp = employeeById.get(l.employeeId);
            if (!emp) return null;
            const remaining = l.totalAmount - l.paidAmount;
            const pct = Math.round((l.paidAmount / l.totalAmount) * 100);
            return (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} />
                    <span className="font-medium text-slate-900">{emp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatCHF(l.totalAmount)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-slate-700">{formatCHF(l.paidAmount)}</div>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatCHF(remaining)}
                </td>
                <td className="px-4 py-3 text-right text-slate-700">
                  {formatCHF(l.monthlyInstallment)}
                </td>
                <td className="px-4 py-3 text-slate-600">{l.reason}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddAmount(l)}
                      disabled={remaining <= 0}
                    >
                      <Wallet size={14} /> Add Amount
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(l)}>
                      <Pencil size={14} /> Edit
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
          {loans.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-sm text-slate-500"
              >
                No loans yet. Add one with the &ldquo;+ Loan&rdquo; button while the
                run is OPEN.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------- helpers ----------

function BannerText({
  counts,
  state,
}: {
  counts: Record<string, number>;
  state: PayrollRun["state"];
}) {
  if (state === "OPEN") {
    return (
      <span className="text-xs text-slate-500">
        Edits allowed · auto-freeze on day 25 unless HR freezes earlier
      </span>
    );
  }
  if (state === "CLOSED") {
    return (
      <span className="text-xs text-slate-500">
        Run is closed — read-only history
      </span>
    );
  }
  const parts: string[] = [];
  for (const k of [
    "DRAFT",
    "SUBMITTED",
    "CHANGES_NEEDED",
    "APPROVED",
    "IN_FINANCE_QUEUE",
    "PAID",
    "EXCLUDED",
  ] as const) {
    if (counts[k]) parts.push(`${counts[k]} ${labelOf(k)}`);
  }
  return <span className="text-xs text-slate-500">{parts.join(" · ")}</span>;
}

function labelOf(s: EmployeePaymentStatus): string {
  return {
    DRAFT: "draft",
    SUBMITTED: "submitted",
    CHANGES_NEEDED: "changes needed",
    APPROVED: "approved",
    IN_FINANCE_QUEUE: "queued",
    PAID: "paid",
    EXCLUDED: "excluded",
  }[s];
}

function canSelect(runState: PayrollRun["state"], itemStatus: RunItem["status"]) {
  if (runState !== "FROZEN") return false;
  return (
    itemStatus === "DRAFT" ||
    itemStatus === "CHANGES_NEEDED" ||
    itemStatus === "APPROVED"
  );
}

function hasManualDeduction(deductions: Deduction[], empId: string) {
  return deductions.some((d) => d.employeeId === empId && d.source === "MANUAL");
}

function ExcludeButton({ runId, employeeId }: { runId: string; employeeId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="inline-flex items-center gap-1 rounded text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
      disabled={pending}
      title="Exclude this employee from this run (e.g. unpaid leave)"
      onClick={() =>
        startTransition(async () => {
          await excludeEmployee(runId, employeeId);
        })
      }
    >
      <UserMinus size={12} /> Exclude
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}

// Type-only helper used in the AllTab signature
declare function buildRowsType(): {
  item: RunItem;
  emp: Employee;
  t: ReturnType<typeof computeTotals>;
  empBonuses: Bonus[];
  empDeductions: Deduction[];
}[];
