"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Pencil, Plus, Trash2, X, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { computeTotals, formatCHF } from "@/lib/domain/totals";
import { deleteBonus, deleteDeduction } from "@/lib/actions";
import type {
  Bonus,
  Deduction,
  Employee,
  Loan,
  PayrollRun,
  RunItem,
} from "@/lib/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
  run: PayrollRun;
  employee: Employee | null;
  item: RunItem | null;
  bonuses: Bonus[];
  deductions: Deduction[];
  loans: Loan[];
  onAddBonus: () => void;
  onAddDeduction: () => void;
  onEditBonus: (b: Bonus) => void;
  onEditDeduction: (d: Deduction) => void;
  onEditLoan: (l: Loan) => void;
  onAddLoanAmount: (l: Loan) => void;
}

export function EmployeeDrawer({
  open,
  onClose,
  run,
  employee,
  item,
  bonuses,
  deductions,
  loans,
  onAddBonus,
  onAddDeduction,
  onEditBonus,
  onEditDeduction,
  onEditLoan,
  onAddLoanAmount,
}: Props) {
  const [pending, startTransition] = useTransition();

  if (!employee || !item) return null;

  const editable =
    run.state === "OPEN" &&
    (item.status === "DRAFT" || item.status === "CHANGES_NEEDED");

  const totals = computeTotals(employee, bonuses, deductions);
  const manualDeductions = deductions.filter((d) => d.source === "MANUAL");
  const loanDeductions = deductions.filter((d) => d.source !== "MANUAL");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee.name}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            <X size={14} /> Close
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Header summary */}
        <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <div className="text-xs text-slate-500">{employee.department}</div>
            <div className="mt-1">
              <StatusBadge status={item.status} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Total this run</div>
            <div className="text-lg font-semibold text-slate-900">
              {formatCHF(totals.total)}
            </div>
          </div>
        </div>

        {/* Admin's change note when flagged */}
        {item.status === "CHANGES_NEEDED" && item.changeNote && (
          <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Admin requested changes</div>
              <div className="mt-0.5">{item.changeNote}</div>
            </div>
          </div>
        )}

        {/* Run state hint */}
        {!editable && run.state === "FROZEN" && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            This row is locked. {item.status === "CHANGES_NEEDED"
              ? "Re-open the run to edit, or use Re-submit flagged if no edits are needed."
              : "Edits aren't allowed once an employee has been submitted."}
          </div>
        )}

        {/* Salary breakdown — expanded line by line so HR can see each bonus
            and deduction independently and which one contributes what. The
            number-only summary stays visible in the All-tab columns. */}
        <Section title="Salary breakdown">
          <Row label="Basic salary" value={formatCHF(totals.basicSalary)} />

          {bonuses.length > 0 && (
            <>
              <SubHeader>
                + Bonuses ({bonuses.length}) · subtotal{" "}
                <span className="font-semibold text-emerald-700">
                  +{formatCHF(totals.bonusTotal)}
                </span>
              </SubHeader>
              {bonuses.map((b) => (
                <Row
                  key={b.id}
                  indent
                  label={b.reason || "Bonus"}
                  value={`+${formatCHF(b.amount)}`}
                  positive
                />
              ))}
            </>
          )}

          {manualDeductions.length > 0 && (
            <>
              <SubHeader>
                − Deductions ({manualDeductions.length}) · subtotal{" "}
                <span className="font-semibold text-red-700">
                  -{formatCHF(totals.deductionTotal)}
                </span>
              </SubHeader>
              {manualDeductions.map((d) => (
                <Row
                  key={d.id}
                  indent
                  label={d.reason || "Deduction"}
                  value={`-${formatCHF(d.amount)}`}
                  negative
                />
              ))}
            </>
          )}

          {loanDeductions.length > 0 && (
            <>
              <SubHeader>
                − Loan ({loanDeductions.length}) · subtotal{" "}
                <span className="font-semibold text-red-700">
                  -{formatCHF(totals.loanInstallmentTotal + totals.extraLoanRepaymentTotal)}
                </span>
              </SubHeader>
              {loanDeductions.map((d) => (
                <Row
                  key={d.id}
                  indent
                  label={d.reason || "Loan"}
                  value={`-${formatCHF(d.amount)}`}
                  negative
                />
              ))}
            </>
          )}

          <div className="mt-2 border-t border-slate-200 pt-2">
            <Row label="Net" value={formatCHF(totals.total)} bold />
          </div>
        </Section>

        {/* Bonuses */}
        <Section
          title="Bonuses"
          action={
            editable && (
              <Button size="sm" variant="outline" onClick={onAddBonus}>
                <Plus size={14} /> Add bonus
              </Button>
            )
          }
        >
          {bonuses.length === 0 ? (
            <Empty>No bonuses for this run.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {bonuses.map((b) => (
                <li key={b.id} className="flex items-start gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-emerald-700">
                      +{formatCHF(b.amount)}
                    </div>
                    <div className="text-xs text-slate-600">{b.reason}</div>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1">
                      <button
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                        onClick={() => onEditBonus(b)}
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
                        title="Remove this bonus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Manual deductions */}
        <Section
          title="Deductions"
          action={
            editable && (
              <Button size="sm" variant="outline" onClick={onAddDeduction}>
                <Plus size={14} /> Add deduction
              </Button>
            )
          }
        >
          {manualDeductions.length === 0 ? (
            <Empty>No manual deductions for this run.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {manualDeductions.map((d) => (
                <li key={d.id} className="flex items-start gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-red-700">
                      -{formatCHF(d.amount)}
                    </div>
                    <div className="text-xs text-slate-600">{d.reason}</div>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1">
                      <button
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                        onClick={() => onEditDeduction(d)}
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
                        title="Remove this deduction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Loan-source deductions (read-only here, manage via loans) */}
        {loanDeductions.length > 0 && (
          <Section title="Loan deductions (auto)">
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {loanDeductions.map((d) => (
                <li key={d.id} className="flex items-start gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-red-700">
                      -{formatCHF(d.amount)}
                    </div>
                    <div className="text-xs text-slate-600">{d.reason}</div>
                  </div>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                    auto
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Loans owned by this employee */}
        {loans.length > 0 && (
          <Section title="Active loans">
            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {loans.map((l) => {
                const remaining = l.totalAmount - l.paidAmount;
                return (
                  <li key={l.id} className="flex items-start gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">
                        {formatCHF(l.totalAmount)} loan
                      </div>
                      <div className="text-xs text-slate-600">
                        {l.reason} · {formatCHF(l.monthlyInstallment)}/mo ·{" "}
                        {formatCHF(remaining)} left
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddLoanAmount(l)}
                        disabled={remaining <= 0}
                      >
                        <Wallet size={12} /> Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEditLoan(l)}>
                        <Pencil size={12} /> Edit
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>
    </Modal>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  positive,
  negative,
  bold,
  indent,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1 text-sm ${indent ? "pl-4" : ""}`}
    >
      <span
        className={
          bold
            ? "font-semibold text-slate-900"
            : indent
              ? "text-xs text-slate-500 truncate pr-2"
              : "text-slate-600"
        }
      >
        {label}
      </span>
      <span
        className={
          bold
            ? "font-semibold text-slate-900"
            : positive
              ? "font-medium text-emerald-700"
              : negative
                ? "font-medium text-red-700"
                : "text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 pt-1 text-xs font-medium text-slate-500">
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
      {children}
    </p>
  );
}
