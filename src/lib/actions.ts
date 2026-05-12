"use server";

import { revalidatePath } from "next/cache";
import { db } from "./domain/store";
import { loadStore, saveStore } from "./domain/persistence";
import {
  canTransitionRun,
  canTransitionEmployee,
  isRowEditable,
} from "./domain/state-machine";
import {
  EVALUATION_CATEGORIES,
  type AmountSpec,
  type Employee,
  type EvaluationCategory,
  type EvaluationScore,
  type ExperienceCertificatePayload,
  type HRLetterPayload,
  type IssuedDocumentType,
  type PayrollFrequency,
  type Role,
} from "./domain/types";
import { resolveAmount } from "./domain/totals";
import {
  sendDocumentEmail,
  sendEvaluationEmail,
  sendPayslipEmail,
} from "./email/send";

// Hard-coded "current user" for demo — real impl plugs auth in here.
function actor(role: Role) {
  return {
    actor: role,
    actorName:
      role === "HR" ? "Yossef" : role === "ADMIN" ? "Admin User" : "Finance User",
  };
}

// Every action calls `await init()` first and `await refresh()` last so the
// in-memory store is hydrated from Redis before mutation and persisted back
// after. On serverless this is the only thing keeping state coherent across
// invocations; locally with no Redis configured both calls are no-ops.
async function init() {
  await loadStore();
}

async function refresh() {
  await saveStore();
  revalidatePath("/payroll");
  revalidatePath("/admin/approvals");
  revalidatePath("/finance/queue");
}

// ---- Run creation ----

// Create a new OPEN run for (frequency, period) and seed it with all
// employees of that frequency + their active-loan installments.
export async function startRun(input: {
  frequency: "MONTHLY" | "BIWEEKLY" | "WEEKLY" | "HOURLY";
  periodKey: string;
  periodLabel: string;
}) {
  await init();
  const existing = db.getRunByPeriod(input.frequency, input.periodKey);
  if (existing) throw new Error("Run already exists for this period");
  const run = db.createRun(input);
  db.attachActiveLoanInstallments(run.id);
  db.appendAudit({ runId: run.id, ...actor("HR"), action: "Run created" });
  await refresh();
  return run;
}

// ---- Bonuses & deductions (only allowed when run is OPEN or row is CHANGES_NEEDED) ----

export async function addBonus(input: {
  runId: string;
  employeeId: string;
  spec: AmountSpec;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (!Number.isFinite(input.spec.value) || input.spec.value <= 0) {
    throw new Error("Bonus value must be a positive number");
  }
  const item = db.getRunItem(input.runId, input.employeeId);
  if (!item) throw new Error("Employee is not in this run");
  if (!isRowEditable(run.state, item.status)) {
    throw new Error(
      `Cannot add bonus: employee is ${item.status} on a ${run.state} run`,
    );
  }
  const emp = db.getEmployee(input.employeeId);
  if (!emp) throw new Error("Employee not found");
  // Resolve to CHF against the *current* basicSalary. This freezes the
  // value at issue time so a later raise doesn't retroactively change it.
  const amount = resolveAmount(input.spec, emp.basicSalary);
  if (amount <= 0) {
    throw new Error("Resolved bonus amount must be positive");
  }
  const b = db.addBonus({
    runId: input.runId,
    employeeId: input.employeeId,
    amount,
    spec: input.spec,
    reason: input.reason,
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Added bonus ${amount} CHF`,
    note: input.reason,
  });
  await refresh();
  return b;
}

export async function addDeduction(input: {
  runId: string;
  employeeId: string;
  spec: AmountSpec;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (!Number.isFinite(input.spec.value) || input.spec.value <= 0) {
    throw new Error("Deduction value must be a positive number");
  }
  const item = db.getRunItem(input.runId, input.employeeId);
  if (!item) throw new Error("Employee is not in this run");
  if (!isRowEditable(run.state, item.status)) {
    throw new Error(
      `Cannot add deduction: employee is ${item.status} on a ${run.state} run`,
    );
  }
  const emp = db.getEmployee(input.employeeId);
  if (!emp) throw new Error("Employee not found");
  const amount = resolveAmount(input.spec, emp.basicSalary);
  if (amount <= 0) {
    throw new Error("Resolved deduction amount must be positive");
  }
  const d = db.addDeduction({
    runId: input.runId,
    employeeId: input.employeeId,
    amount,
    spec: input.spec,
    reason: input.reason,
    source: "MANUAL",
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Added deduction ${amount} CHF`,
    note: input.reason,
  });
  await refresh();
  return d;
}

// ---- Run state transitions ----

export async function freezeRun(runId: string, source: "MANUAL" | "AUTO" = "MANUAL") {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  // Idempotent: a double-click or stale-UI re-submit shouldn't crash. If the
  // run is already FROZEN we silently return — refresh() will still revalidate
  // so the UI catches up.
  if (run.state === "FROZEN") {
    await refresh();
    return;
  }
  if (!canTransitionRun(run.state, "FROZEN")) {
    throw new Error(`Cannot freeze from ${run.state}`);
  }
  db.setRunState(runId, "FROZEN");
  db.appendAudit({
    runId,
    ...actor("HR"),
    action: source === "AUTO" ? "Auto-frozen on cutoff day" : "Manually frozen",
  });
  await refresh();
}

export async function reopenRun(runId: string) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  if (run.state === "OPEN") {
    await refresh();
    return;
  }
  if (!canTransitionRun(run.state, "OPEN")) {
    throw new Error(`Cannot re-open from ${run.state}`);
  }
  db.setRunState(runId, "OPEN");
  db.appendAudit({ runId, ...actor("HR"), action: "Re-opened run" });
  await refresh();
}

// Submit a SUBSET of employees for approval. Run state stays FROZEN; only the
// selected employees flip to SUBMITTED. HR can call this multiple times across
// days — each call is an independent batch.
export async function submitForApproval(runId: string, employeeIds: string[], note?: string) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  if (run.state === "CLOSED") {
    throw new Error("Cannot submit on a CLOSED run");
  }
  // Idempotent freeze: if HR re-opened to edit and forgot to re-freeze (or a
  // stale tab fires the action while another tab has re-opened the run),
  // freeze automatically rather than 500-ing.
  if (run.state === "OPEN") {
    db.setRunState(runId, "FROZEN");
    db.appendAudit({
      runId,
      ...actor("HR"),
      action: "Auto-frozen (submit on open run)",
    });
  }
  if (employeeIds.length === 0) throw new Error("Pick at least one employee");
  const items = db.listRunItems(runId);
  let count = 0;
  for (const item of items) {
    if (!employeeIds.includes(item.employeeId)) continue;
    // Allow submit from DRAFT (first time) or CHANGES_NEEDED (re-submit after fix).
    if (item.status === "DRAFT" || item.status === "CHANGES_NEEDED") {
      if (canTransitionEmployee(item.status, "SUBMITTED")) {
        db.setRunItemStatus(item.id, "SUBMITTED", { changeNote: undefined });
        count++;
      }
    }
  }
  db.appendAudit({
    runId,
    ...actor("HR"),
    action: `Submitted ${count} employee(s) for approval`,
    note,
  });
  await refresh();
}

// Admin reviews any subset of currently-SUBMITTED employees. Decisions are
// per-employee; run state does not change.
export async function adminReview(input: {
  runId: string;
  decisions: { employeeId: string; decision: "APPROVE" | "FLAG"; note?: string }[];
  globalNote?: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  let approvedCount = 0;
  let flaggedCount = 0;
  const flagNotes: { employeeId: string; note: string }[] = [];
  for (const d of input.decisions) {
    const item = db.getRunItem(input.runId, d.employeeId);
    if (!item || item.status !== "SUBMITTED") continue;
    if (d.decision === "APPROVE") {
      db.setRunItemStatus(item.id, "APPROVED", { changeNote: undefined });
      approvedCount++;
    } else {
      db.setRunItemStatus(item.id, "CHANGES_NEEDED", { changeNote: d.note });
      flaggedCount++;
      if (d.note?.trim()) {
        flagNotes.push({ employeeId: d.employeeId, note: d.note.trim() });
      }
    }
  }
  // Roll-up entry first
  db.appendAudit({
    runId: input.runId,
    ...actor("ADMIN"),
    action:
      flaggedCount > 0
        ? `Approved ${approvedCount}, requested changes on ${flaggedCount}`
        : `Approved ${approvedCount} employee(s)`,
    note: input.globalNote,
  });
  // Per-flagged audit lines so HR has a clear trail of what to fix.
  for (const f of flagNotes) {
    const emp = db.getEmployee(f.employeeId);
    db.appendAudit({
      runId: input.runId,
      ...actor("ADMIN"),
      action: `Flagged ${emp?.name ?? f.employeeId}`,
      note: f.note,
    });
  }
  await refresh();
}

// Re-submit ALL currently-flagged rows on a run, in one shot. The submit
// action also handles this case, but exposing it as a dedicated server action
// lets HR re-submit without having to re-select the rows manually.
export async function resubmitFlagged(runId: string) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  if (run.state === "CLOSED") {
    throw new Error("Cannot re-submit on a CLOSED run");
  }
  // Idempotent freeze — same reasoning as submitForApproval.
  if (run.state === "OPEN") {
    db.setRunState(runId, "FROZEN");
    db.appendAudit({
      runId,
      ...actor("HR"),
      action: "Auto-frozen (re-submit on open run)",
    });
  }
  const items = db.listRunItems(runId);
  const flagged = items.filter((it) => it.status === "CHANGES_NEEDED");
  if (flagged.length === 0) throw new Error("No flagged rows to re-submit");
  for (const it of flagged) {
    db.setRunItemStatus(it.id, "SUBMITTED", { changeNote: undefined });
  }
  db.appendAudit({
    runId,
    ...actor("HR"),
    action: `Re-submitted ${flagged.length} flagged employee(s)`,
  });
  await refresh();
}

// HR sends a SUBSET of APPROVED employees to the finance queue. Multiple
// payment batches per run are supported.
export async function paySelected(runId: string, employeeIds: string[]) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  if (run.state === "CLOSED") {
    throw new Error("Cannot pay on a CLOSED run");
  }
  if (run.state === "OPEN") {
    db.setRunState(runId, "FROZEN");
    db.appendAudit({
      runId,
      ...actor("HR"),
      action: "Auto-frozen (pay on open run)",
    });
  }
  if (employeeIds.length === 0) throw new Error("Pick at least one employee");
  const items = db.listRunItems(runId);
  let queued = 0;
  for (const it of items) {
    if (
      employeeIds.includes(it.employeeId) &&
      canTransitionEmployee(it.status, "IN_FINANCE_QUEUE")
    ) {
      db.setRunItemStatus(it.id, "IN_FINANCE_QUEUE", {
        markedForPaymentAt: new Date().toISOString(),
      });
      queued++;
    }
  }
  db.appendAudit({
    runId,
    ...actor("HR"),
    action: `Sent ${queued} employee(s) to Finance for payment`,
  });
  await refresh();
}

// ---- Loans ----

export async function addLoan(input: {
  // The run the loan should auto-attach an installment to. Caller (modal)
  // passes the currently-viewed OPEN run so the auto-attach is deterministic
  // and never lands in some other open run that happens to exist.
  runId: string;
  employeeId: string;
  totalAmount: number;
  durationMonths: number;
  monthlyInstallment: number;
  reason: string;
}) {
  await init();
  if (input.totalAmount <= 0) throw new Error("Total amount must be > 0");
  if (input.durationMonths <= 0) throw new Error("Duration must be > 0");
  if (input.monthlyInstallment <= 0) throw new Error("Monthly installment must be > 0");
  const expected = input.monthlyInstallment * input.durationMonths;
  if (Math.abs(expected - input.totalAmount) > 1) {
    throw new Error(
      `Installment × duration (${expected}) does not equal total (${input.totalAmount})`,
    );
  }
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Cannot add loan: run is ${run.state}. Re-open the run first.`);
  }
  const emp = db.getEmployee(input.employeeId);
  if (!emp) throw new Error("Employee not found");
  if (emp.payrollFrequency !== run.frequency) {
    throw new Error(
      `Employee is on ${emp.payrollFrequency} payroll but run is ${run.frequency}`,
    );
  }
  const loan = db.addLoan({
    employeeId: input.employeeId,
    totalAmount: input.totalAmount,
    durationMonths: input.durationMonths,
    monthlyInstallment: input.monthlyInstallment,
    reason: input.reason,
  });
  // Auto-attach this period's installment to the run we were given.
  db.addDeduction({
    runId: input.runId,
    employeeId: input.employeeId,
    amount: input.monthlyInstallment,
    reason: "Loan installment (auto)",
    source: "LOAN_INSTALLMENT",
    loanId: loan.id,
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Created loan ${input.totalAmount} CHF · auto-attached installment ${input.monthlyInstallment} CHF`,
    note: input.reason,
  });
  await refresh();
  return loan;
}

export async function updateLoan(input: {
  loanId: string;
  totalAmount: number;
  durationMonths: number;
  monthlyInstallment: number;
}) {
  await init();
  if (input.monthlyInstallment <= 0) throw new Error("Monthly installment must be > 0");
  if (input.durationMonths <= 0) throw new Error("Duration must be > 0");
  const expected = input.monthlyInstallment * input.durationMonths;
  if (Math.abs(expected - input.totalAmount) > 1) {
    throw new Error(
      `Installment × duration (${expected}) does not equal total (${input.totalAmount})`,
    );
  }
  db.updateLoan(input.loanId, {
    totalAmount: input.totalAmount,
    durationMonths: input.durationMonths,
    monthlyInstallment: input.monthlyInstallment,
  });
  await refresh();
}

// One-off extra repayment: adds a new EXTRA_LOAN_REPAYMENT deduction line to
// the run the caller specifies. Same rationale as addLoan — multiple OPEN runs
// can coexist, so the caller picks which one this repayment lands on.
export async function addExtraLoanRepayment(input: {
  runId: string;
  loanId: string;
  amount: number;
}) {
  await init();
  if (input.amount <= 0) throw new Error("Amount must be > 0");
  const loan = db.getLoan(input.loanId);
  if (!loan) throw new Error("Loan not found");
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Run is ${run.state}; extra repayment needs an OPEN run.`);
  }
  db.addDeduction({
    runId: input.runId,
    employeeId: loan.employeeId,
    amount: input.amount,
    reason: `Extra loan repayment`,
    source: "EXTRA_LOAN_REPAYMENT",
    loanId: loan.id,
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Added extra loan repayment ${input.amount} CHF`,
  });
  await refresh();
}

export async function updateBonus(input: {
  runId: string;
  bonusId: string;
  spec: AmountSpec;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (!Number.isFinite(input.spec.value) || input.spec.value <= 0) {
    throw new Error("Bonus value must be a positive number");
  }
  const bonus = db.getBonus(input.bonusId);
  if (!bonus) throw new Error("Bonus not found");
  const item = db.getRunItem(input.runId, bonus.employeeId);
  if (!item) throw new Error("Employee is not in this run");
  if (!isRowEditable(run.state, item.status)) {
    throw new Error(
      `Cannot edit a bonus on a ${item.status} row in a ${run.state} run`,
    );
  }
  const emp = db.getEmployee(bonus.employeeId);
  if (!emp) throw new Error("Employee not found");
  const amount = resolveAmount(input.spec, emp.basicSalary);
  if (amount <= 0) {
    throw new Error("Resolved bonus amount must be positive");
  }
  db.updateBonus(input.bonusId, {
    amount,
    spec: input.spec,
    reason: input.reason,
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Edited a bonus → ${amount} CHF`,
    note: input.reason,
  });
  await refresh();
}

export async function updateDeduction(input: {
  runId: string;
  deductionId: string;
  spec: AmountSpec;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (!Number.isFinite(input.spec.value) || input.spec.value <= 0) {
    throw new Error("Deduction value must be a positive number");
  }
  const ded = db.getDeduction(input.deductionId);
  if (!ded) throw new Error("Deduction not found");
  if (ded.source !== "MANUAL") {
    throw new Error(
      "Loan deductions cannot be edited here. Use the Loans tab.",
    );
  }
  const item = db.getRunItem(input.runId, ded.employeeId);
  if (!item) throw new Error("Employee is not in this run");
  if (!isRowEditable(run.state, item.status)) {
    throw new Error(
      `Cannot edit a deduction on a ${item.status} row in a ${run.state} run`,
    );
  }
  const emp = db.getEmployee(ded.employeeId);
  if (!emp) throw new Error("Employee not found");
  const amount = resolveAmount(input.spec, emp.basicSalary);
  if (amount <= 0) {
    throw new Error("Resolved deduction amount must be positive");
  }
  db.updateDeduction(input.deductionId, {
    amount,
    spec: input.spec,
    reason: input.reason,
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Edited a deduction → ${amount} CHF`,
    note: input.reason,
  });
  await refresh();
}

export async function deleteBonus(runId: string, bonusId: string) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  const bonus = db.getBonus(bonusId);
  if (!bonus) throw new Error("Bonus not found");
  const item = db.getRunItem(runId, bonus.employeeId);
  if (!item) throw new Error("Employee is not in this run");
  if (!isRowEditable(run.state, item.status)) {
    throw new Error(
      `Cannot delete bonus on a ${item.status} row in a ${run.state} run`,
    );
  }
  db.removeBonus(bonusId);
  db.appendAudit({ runId, ...actor("HR"), action: "Removed a bonus" });
  await refresh();
}

export async function deleteDeduction(runId: string, deductionId: string) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  // Loan-driven deductions are managed by the loan record. Deleting the line
  // here would orphan the loan's installment schedule.
  const ded = db
    .listDeductions(runId)
    .find((d) => d.id === deductionId);
  if (!ded) throw new Error("Deduction not found");
  if (ded.source !== "MANUAL") {
    throw new Error(
      "Loan deductions cannot be deleted directly. Edit or remove the loan instead.",
    );
  }
  const item = db.getRunItem(runId, ded.employeeId);
  if (!item) throw new Error("Employee is not in this run");
  if (!isRowEditable(run.state, item.status)) {
    throw new Error(
      `Cannot delete deduction on a ${item.status} row in a ${run.state} run`,
    );
  }
  db.removeDeduction(deductionId);
  db.appendAudit({ runId, ...actor("HR"), action: "Removed a deduction" });
  await refresh();
}

// Mark a single employee EXCLUDED for this run (e.g. on unpaid leave). Allowed
// any time before they enter the finance queue.
export async function excludeEmployee(runId: string, employeeId: string) {
  await init();
  const item = db.getRunItem(runId, employeeId);
  if (!item) throw new Error("Item not found");
  if (!canTransitionEmployee(item.status, "EXCLUDED")) {
    throw new Error(`Cannot exclude from ${item.status}`);
  }
  db.setRunItemStatus(item.id, "EXCLUDED");
  db.appendAudit({
    runId,
    ...actor("HR"),
    action: `Excluded employee ${employeeId} from this run`,
  });
  await refresh();
}

// ---- Finance ----

export async function markPaid(runId: string, employeeId: string) {
  await init();
  const item = db.getRunItem(runId, employeeId);
  if (!item) throw new Error("Item not found");
  if (!canTransitionEmployee(item.status, "PAID")) {
    throw new Error(`Cannot pay from ${item.status}`);
  }
  db.setRunItemStatus(item.id, "PAID", { paidAt: new Date().toISOString() });
  // Mark the payslip email as pending; the actual send is kicked off after
  // refresh() so the row first appears in the employee's history with PENDING,
  // then flips to SENT/FAILED when the send completes and re-revalidates.
  db.setRunItemPayslipEmailStatus(item.id, "PENDING");
  // When a payment confirms, every loan-line on this employee's run becomes
  // real — increment the loan's paid amount so the schedule UI advances.
  for (const d of db.listAllRunDeductionsForEmployee(runId, employeeId)) {
    if ((d.source === "LOAN_INSTALLMENT" || d.source === "EXTRA_LOAN_REPAYMENT") && d.loanId) {
      db.incrementLoanPaid(d.loanId, d.amount);
    }
  }
  db.appendAudit({
    runId,
    ...actor("FINANCE"),
    action: `Marked employee ${employeeId} as PAID`,
  });
  maybeCloseRun(runId);
  await refresh();
  // Fire-and-forget — failures are logged inside sendPayslipEmail and the
  // row's emailStatus reflects the outcome. We don't block the action on it.
  void sendPayslipEmail(runId, employeeId).catch((err) =>
    console.error("[actions] sendPayslipEmail failed:", err),
  );
}

// Bulk-mark a subset (or all) of IN_FINANCE_QUEUE items as PAID in one
// server roundtrip. Skips items that aren't in the queue (so callers can
// be sloppy about selection without crashing).
export async function markBulkPaid(runId: string, employeeIds: string[]) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  if (employeeIds.length === 0) throw new Error("Pick at least one employee");
  const now = new Date().toISOString();
  let count = 0;
  const paidEmployeeIds: string[] = [];
  for (const empId of employeeIds) {
    const item = db.getRunItem(runId, empId);
    if (!item) continue;
    if (!canTransitionEmployee(item.status, "PAID")) continue;
    db.setRunItemStatus(item.id, "PAID", { paidAt: now });
    db.setRunItemPayslipEmailStatus(item.id, "PENDING");
    for (const d of db.listAllRunDeductionsForEmployee(runId, empId)) {
      if (
        (d.source === "LOAN_INSTALLMENT" || d.source === "EXTRA_LOAN_REPAYMENT") &&
        d.loanId
      ) {
        db.incrementLoanPaid(d.loanId, d.amount);
      }
    }
    paidEmployeeIds.push(empId);
    count++;
  }
  if (count > 0) {
    db.appendAudit({
      runId,
      ...actor("FINANCE"),
      action: `Marked ${count} employee(s) as PAID`,
    });
    maybeCloseRun(runId);
  }
  await refresh();
  // Fire-and-forget: dispatch a payslip email per paid employee. Each call
  // updates its own row's status and revalidates the relevant paths.
  for (const empId of paidEmployeeIds) {
    void sendPayslipEmail(runId, empId).catch((err) =>
      console.error("[actions] sendPayslipEmail failed:", err),
    );
  }
  return count;
}

function maybeCloseRun(runId: string) {
  const items = db.listRunItems(runId);
  const allDone = items.every(
    (it) => it.status === "PAID" || it.status === "EXCLUDED",
  );
  if (allDone) {
    db.setRunState(runId, "CLOSED");
    db.appendAudit({
      runId,
      ...actor("FINANCE"),
      action: "All payments confirmed — run closed",
    });
  }
}

// ---- Employee details: evaluations ----

export async function submitEvaluation(input: {
  employeeId: string;
  periodLabel: string;
  scores: Record<EvaluationCategory, EvaluationScore>;
  strengths: string;
  areasToImprove: string;
  goalsNextPeriod?: string;
  comments?: string;
}) {
  await init();
  const emp = db.getEmployee(input.employeeId);
  if (!emp) throw new Error("Employee not found");
  // Defensive: ensure every category has a score (the modal validates this
  // but a misbehaving client shouldn't be able to skip it).
  for (const cat of EVALUATION_CATEGORIES) {
    if (!input.scores[cat]) throw new Error(`Missing score for ${cat}`);
  }
  const overall =
    Object.values(input.scores).reduce((a, b) => a + b, 0) /
    EVALUATION_CATEGORIES.length;
  const ev = db.addEvaluation({
    employeeId: input.employeeId,
    periodLabel: input.periodLabel,
    evaluatedAt: new Date().toISOString(),
    evaluatedBy: actor("HR").actorName,
    scores: input.scores,
    overall,
    strengths: input.strengths,
    areasToImprove: input.areasToImprove,
    goalsNextPeriod: input.goalsNextPeriod,
    comments: input.comments,
    emailedTo: emp.email,
    emailStatus: "PENDING",
  });
  await refresh();
  void sendEvaluationEmail(ev.id).catch((err) =>
    console.error("[actions] sendEvaluationEmail failed:", err),
  );
  return ev;
}

export async function resendEvaluationEmail(evaluationId: string) {
  await init();
  const ev = db.getEvaluation(evaluationId);
  if (!ev) throw new Error("Evaluation not found");
  db.setEvaluationEmailStatus(ev.id, "PENDING");
  await refresh();
  void sendEvaluationEmail(ev.id).catch((err) =>
    console.error("[actions] resendEvaluationEmail failed:", err),
  );
}

// ---- Employee details: issued documents (experience cert / HR letter) ----

export async function issueDocument(input: {
  employeeId: string;
  type: IssuedDocumentType;
  subject: string;
  payload: ExperienceCertificatePayload | HRLetterPayload;
}) {
  await init();
  const emp = db.getEmployee(input.employeeId);
  if (!emp) throw new Error("Employee not found");
  const doc = db.addIssuedDocument({
    employeeId: input.employeeId,
    type: input.type,
    issuedAt: new Date().toISOString(),
    issuedBy: actor("HR").actorName,
    subject: input.subject,
    payload: input.payload,
    emailedTo: emp.email,
    emailStatus: "PENDING",
  });
  await refresh();
  void sendDocumentEmail(doc.id).catch((err) =>
    console.error("[actions] sendDocumentEmail failed:", err),
  );
  return doc;
}

export async function resendDocumentEmail(documentId: string) {
  await init();
  const doc = db.getIssuedDocument(documentId);
  if (!doc) throw new Error("Document not found");
  db.setIssuedDocumentEmailStatus(doc.id, "PENDING");
  await refresh();
  void sendDocumentEmail(doc.id).catch((err) =>
    console.error("[actions] resendDocumentEmail failed:", err),
  );
}

export async function resendPayslipEmail(runId: string, employeeId: string) {
  await init();
  const item = db.getRunItem(runId, employeeId);
  if (!item) throw new Error("Run item not found");
  if (item.status !== "PAID") throw new Error("Payslip can only be resent for paid rows");
  db.setRunItemPayslipEmailStatus(item.id, "PENDING");
  await refresh();
  void sendPayslipEmail(runId, employeeId).catch((err) =>
    console.error("[actions] resendPayslipEmail failed:", err),
  );
}

// ---- Employee details: notes (real CRUD — small enough to fully implement) ----

export async function addNote(input: {
  employeeId: string;
  title: string;
  body: string;
}) {
  await init();
  if (!input.title.trim()) throw new Error("Title required");
  const n = db.addNote({
    employeeId: input.employeeId,
    title: input.title,
    body: input.body,
  });
  await refresh();
  revalidatePath(`/employees/${input.employeeId}`);
  return n;
}

export async function updateNote(noteId: string, patch: { title?: string; body?: string }) {
  await init();
  const n = db.updateNote(noteId, patch);
  await refresh();
  if (n) revalidatePath(`/employees/${n.employeeId}`);
}

export async function removeNote(noteId: string, employeeId: string) {
  await init();
  db.removeNote(noteId);
  await refresh();
  revalidatePath(`/employees/${employeeId}`);
}

// ---- Employee details: attachments (metadata only — no real file upload) ----

export async function addAttachment(input: {
  employeeId: string;
  name: string;
  kind: "CONTRACT" | "MILITARY" | "IDENTITY" | "EDUCATION" | "OTHER";
  sizeBytes: number;
}) {
  await init();
  if (!input.name.trim()) throw new Error("Filename required");
  const a = db.addAttachment(input);
  await refresh();
  revalidatePath(`/employees/${input.employeeId}`);
  return a;
}

export async function removeAttachment(attachmentId: string, employeeId: string) {
  await init();
  db.removeAttachment(attachmentId);
  await refresh();
  revalidatePath(`/employees/${employeeId}`);
}

// ---- Employee profile edits (Personal / Employee / Bank info, Skills) ----

// One generic patcher for all editable top-level fields. The modals send only
// the fields they own — Personal Info sends dob/gender/etc., Employee Info
// sends jobTitle/managerId/etc., Skills sends just `skills`. We trust the
// callers and don't enumerate allowed keys here.
type EmployeePatch = Partial<Omit<Employee, "id" | "bank">>;

export async function updateEmployeeProfile(
  employeeId: string,
  patch: EmployeePatch,
) {
  await init();
  const e = db.getEmployee(employeeId);
  if (!e) throw new Error("Employee not found");
  db.updateEmployee(employeeId, patch);
  await refresh();
  revalidatePath(`/employees/${employeeId}`);
}

export async function updateEmployeeBank(
  employeeId: string,
  bankPatch: Partial<Employee["bank"]>,
) {
  await init();
  const e = db.getEmployee(employeeId);
  if (!e) throw new Error("Employee not found");
  db.updateEmployeeBank(employeeId, bankPatch);
  await refresh();
  revalidatePath(`/employees/${employeeId}`);
}

// Record a salary raise: writes a SalaryUpgrade history row AND bumps the
// employee's basicSalary so future runs use it.
export async function addSalaryUpgrade(input: {
  employeeId: string;
  newSalary: number;
}) {
  await init();
  const e = db.getEmployee(input.employeeId);
  if (!e) throw new Error("Employee not found");
  if (!Number.isFinite(input.newSalary) || input.newSalary < 0) {
    throw new Error("Salary must be a non-negative number");
  }
  const su = db.addSalaryUpgrade(input.employeeId, input.newSalary);
  if (!su) throw new Error("Failed to add salary upgrade");
  await refresh();
  revalidatePath(`/employees/${input.employeeId}`);
  return su;
}

// ---- New employee creation (from /employees list) ----

export async function addEmployee(input: {
  name: string;
  email: string;
  department: string;
  jobTitle?: string;
  basicSalary: number;
  payrollFrequency: PayrollFrequency;
}) {
  await init();
  if (!input.name.trim()) throw new Error("Name required");
  if (!input.email.trim()) throw new Error("Email required");
  if (!Number.isFinite(input.basicSalary) || input.basicSalary < 0) {
    throw new Error("Salary must be a non-negative number");
  }
  const emp = db.addEmployee({
    name: input.name.trim(),
    email: input.email.trim(),
    department: input.department.trim() || "—",
    jobTitle: input.jobTitle?.trim() || undefined,
    basicSalary: input.basicSalary,
    payrollFrequency: input.payrollFrequency,
    employeeType: "Fulltime",
    workLocation: "Remote",
    status: "Active",
    joinDate: new Date().toISOString().slice(0, 10),
    skills: [],
    bank: {
      bankName: "—",
      accountName: input.name.trim(),
      accountNo: "—",
      iban: "—",
    },
  });
  await refresh();
  revalidatePath("/employees");
  return emp;
}

// ---- Employee dashboard: set the currently impersonated employee via cookie ----

// The role switcher writes this cookie so the server-rendered /me page knows
// which employee to show. No real auth — same demo posture as the role switch.
export async function setCurrentEmployee(employeeId: string) {
  await init();
  const { cookies } = await import("next/headers");
  const store = await cookies();
  if (employeeId) {
    store.set("somion.employeeId", employeeId, {
      path: "/",
      sameSite: "lax",
      // 30 days — generous enough for demo, short enough to expire stale state.
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    store.delete("somion.employeeId");
  }
  revalidatePath("/me");
}
