"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { RunStateBadge } from "@/components/payroll/run-state-badge";
import { StatusBadge } from "@/components/payroll/status-badge";
import { adminReview } from "@/lib/actions";
import { computeTotals, formatCHF } from "@/lib/domain/totals";
import type {
  AuditEntry,
  Bonus,
  Deduction,
  Employee,
  PayrollRun,
  RunItem,
} from "@/lib/domain/types";

type Decision = "PENDING" | "APPROVE" | "FLAG";

interface Props {
  run: PayrollRun;
  rows: {
    item: RunItem;
    emp: Employee;
    empBonuses: Bonus[];
    empDeductions: Deduction[];
  }[];
  audit: AuditEntry[];
  // The most recent HR submit-for-approval note. Shown as a banner so
  // admin sees the message HR attached to this batch instead of having
  // to scan the audit log on the side.
  latestHrNote?: { note: string; actorName: string; at: string } | null;
}

export function ApprovalReview({ run, rows, audit, latestHrNote }: Props) {
  const initial = rows.reduce<
    Record<string, { decision: Decision; note: string }>
  >((acc, r) => {
    if (r.item.status === "APPROVED")
      acc[r.emp.id] = { decision: "APPROVE", note: "" };
    else if (r.item.status === "CHANGES_NEEDED")
      acc[r.emp.id] = { decision: "FLAG", note: r.item.changeNote ?? "" };
    else acc[r.emp.id] = { decision: "PENDING", note: "" };
    return acc;
  }, {});
  const [decisions, setDecisions] = useState(initial);
  const [globalNote, setGlobalNote] = useState("");
  const [pending, startTransition] = useTransition();

  const allDecided =
    rows.length > 0 &&
    rows.every((r) => decisions[r.emp.id]?.decision !== "PENDING");

  return (
    <>
      {latestHrNote && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <span className="font-semibold">HR note ·</span>
          <span className="leading-snug">
            <span className="text-blue-700">
              {latestHrNote.actorName} ·{" "}
              {new Date(latestHrNote.at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>{" "}
            — {latestHrNote.note}
          </span>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {run.periodLabel} — Approval
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <RunStateBadge state={run.state} />
            <span className="text-xs text-slate-500">{rows.length} employees</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            title="Marks every row Approve and submits in one click"
            disabled={pending || rows.length === 0}
            onClick={() => {
              // Mark every row as APPROVE in local state, then submit
              // immediately. Saves the admin from clicking Approve N times.
              setDecisions((prev) => {
                const next = { ...prev };
                for (const r of rows) next[r.emp.id] = { decision: "APPROVE", note: "" };
                return next;
              });
              startTransition(async () => {
                await adminReview({
                  runId: run.id,
                  decisions: rows.map((r) => ({
                    employeeId: r.emp.id,
                    decision: "APPROVE",
                    note: "",
                  })),
                  globalNote: globalNote || undefined,
                });
              });
            }}
          >
            <CheckCircle2 size={14} /> Approve all ({rows.length})
          </Button>
          <Button
            disabled={!allDecided || pending}
            onClick={() => {
              startTransition(async () => {
                await adminReview({
                  runId: run.id,
                  decisions: rows.map((r) => ({
                    employeeId: r.emp.id,
                    decision: decisions[r.emp.id].decision === "APPROVE" ? "APPROVE" : "FLAG",
                    note: decisions[r.emp.id].note,
                  })),
                  globalNote: globalNote || undefined,
                });
              });
            }}
          >
            Submit Review
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {rows.map(({ item, emp, empBonuses, empDeductions }) => {
            const t = computeTotals(emp, empBonuses, empDeductions);
            const d = decisions[emp.id];
            return (
              <Card key={emp.id}>
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                      {initials(emp.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {emp.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {emp.department}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-base font-semibold text-slate-900">
                      {formatCHF(t.total)}
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <Field label="Basic" value={formatCHF(t.basicSalary)} />
                    <Field
                      label="Bonus"
                      value={t.bonusTotal > 0 ? `+${formatCHF(t.bonusTotal)}` : "--"}
                    />
                    <Field
                      label="Deduction"
                      value={
                        t.deductionTotal > 0
                          ? `-${formatCHF(t.deductionTotal)}`
                          : "--"
                      }
                    />
                    <Field
                      label="Loan"
                      value={
                        t.loanInstallmentTotal > 0
                          ? `-${formatCHF(t.loanInstallmentTotal)}`
                          : "--"
                      }
                    />
                  </div>

                  {(empBonuses.length > 0 || empDeductions.length > 0) && (
                    <div className="mt-4 space-y-2 rounded-md bg-slate-50 p-3 text-xs">
                      {empBonuses.map((b) => (
                        <div key={b.id} className="flex items-start justify-between gap-2">
                          <span className="text-slate-600">
                            <span className="font-medium text-emerald-700">+{formatCHF(b.amount)}</span>{" "}
                            bonus — {b.reason}
                          </span>
                        </div>
                      ))}
                      {empDeductions.map((dd) => (
                        <div key={dd.id} className="flex items-start justify-between gap-2">
                          <span className="text-slate-600">
                            <span className="font-medium text-red-700">-{formatCHF(dd.amount)}</span>{" "}
                            {dd.source === "LOAN_INSTALLMENT" ? "loan" : "deduction"} — {dd.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {run.state === "FROZEN" && (
                    <div className="mt-4 flex flex-wrap items-start gap-2">
                      <Button
                        size="sm"
                        variant={d.decision === "APPROVE" ? "primary" : "outline"}
                        onClick={() =>
                          setDecisions((p) => ({
                            ...p,
                            [emp.id]: { decision: "APPROVE", note: "" },
                          }))
                        }
                      >
                        <CheckCircle2 size={14} /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant={d.decision === "FLAG" ? "primary" : "outline"}
                        onClick={() =>
                          setDecisions((p) => ({
                            ...p,
                            [emp.id]: { decision: "FLAG", note: p[emp.id].note },
                          }))
                        }
                      >
                        <AlertCircle size={14} /> Request changes
                      </Button>
                      {d.decision === "FLAG" && (
                        <Textarea
                          className="mt-2 min-h-[60px]"
                          placeholder="What should HR change?"
                          value={d.note}
                          onChange={(e) =>
                            setDecisions((p) => ({
                              ...p,
                              [emp.id]: { decision: "FLAG", note: e.target.value },
                            }))
                          }
                        />
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}

          {run.state === "FROZEN" && rows.length > 0 && (
            <Card>
              <CardBody>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Note for the run (optional)
                </label>
                <Textarea
                  value={globalNote}
                  onChange={(e) => setGlobalNote(e.target.value)}
                  placeholder="General comments to HR"
                />
              </CardBody>
            </Card>
          )}
        </div>

        {/* Audit panel */}
        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Audit log</h3>
            </CardHeader>
            <CardBody className="space-y-3 text-xs">
              {audit.map((a) => (
                <div key={a.id} className="flex gap-2">
                  <Clock size={12} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-700">{a.action}</div>
                    <div className="text-slate-500">
                      {a.actorName} ({a.actor}) ·{" "}
                      {new Date(a.at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {a.note && (
                      <div className="mt-0.5 text-slate-600 italic">
                        &ldquo;{a.note}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className="mt-0.5 font-medium text-slate-900">{value}</div>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
