"use server";

import { revalidatePath } from "next/cache";
import { db } from "./domain/store";
import { loadStore, saveStore } from "./domain/persistence";
import { canTransitionRun, canTransitionEmployee } from "./domain/state-machine";
import type { Role } from "./domain/types";

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
  amount: number;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Cannot add bonus: run is ${run.state}. Re-open the run first.`);
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Bonus amount must be a positive number");
  }
  const item = db.getRunItem(input.runId, input.employeeId);
  if (!item || (item.status !== "DRAFT" && item.status !== "CHANGES_NEEDED")) {
    throw new Error(
      `Cannot add bonus to an employee whose status is ${item?.status ?? "missing"}`,
    );
  }
  const b = db.addBonus({
    runId: input.runId,
    employeeId: input.employeeId,
    amount: input.amount,
    reason: input.reason,
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Added bonus ${input.amount} CHF`,
    note: input.reason,
  });
  await refresh();
  return b;
}

export async function addDeduction(input: {
  runId: string;
  employeeId: string;
  amount: number;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Cannot add deduction: run is ${run.state}. Re-open the run first.`);
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Deduction amount must be a positive number");
  }
  const item = db.getRunItem(input.runId, input.employeeId);
  if (!item || (item.status !== "DRAFT" && item.status !== "CHANGES_NEEDED")) {
    throw new Error(
      `Cannot add deduction to an employee whose status is ${item?.status ?? "missing"}`,
    );
  }
  const d = db.addDeduction({
    runId: input.runId,
    employeeId: input.employeeId,
    amount: input.amount,
    reason: input.reason,
    source: "MANUAL",
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Added deduction ${input.amount} CHF`,
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
  if (run.state !== "FROZEN") {
    throw new Error(`Run must be FROZEN to submit; currently ${run.state}`);
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
  if (run.state !== "FROZEN") {
    throw new Error("Run must be FROZEN to re-submit flagged rows");
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
  if (run.state !== "FROZEN") {
    throw new Error(`Run must be FROZEN to pay; currently ${run.state}`);
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
  amount: number;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Cannot edit bonus: run is ${run.state}. Re-open the run first.`);
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Bonus amount must be a positive number");
  }
  const bonus = db.getBonus(input.bonusId);
  if (!bonus) throw new Error("Bonus not found");
  const item = db.getRunItem(input.runId, bonus.employeeId);
  if (!item || (item.status !== "DRAFT" && item.status !== "CHANGES_NEEDED")) {
    throw new Error(
      `Cannot edit a bonus on a ${item?.status ?? "missing"} row`,
    );
  }
  db.updateBonus(input.bonusId, { amount: input.amount, reason: input.reason });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Edited a bonus → ${input.amount} CHF`,
    note: input.reason,
  });
  await refresh();
}

export async function updateDeduction(input: {
  runId: string;
  deductionId: string;
  amount: number;
  reason: string;
}) {
  await init();
  const run = db.getRun(input.runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Cannot edit deduction: run is ${run.state}. Re-open the run first.`);
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Deduction amount must be a positive number");
  }
  const ded = db.getDeduction(input.deductionId);
  if (!ded) throw new Error("Deduction not found");
  if (ded.source !== "MANUAL") {
    throw new Error(
      "Loan deductions cannot be edited here. Use the Loans tab.",
    );
  }
  const item = db.getRunItem(input.runId, ded.employeeId);
  if (!item || (item.status !== "DRAFT" && item.status !== "CHANGES_NEEDED")) {
    throw new Error(
      `Cannot edit a deduction on a ${item?.status ?? "missing"} row`,
    );
  }
  db.updateDeduction(input.deductionId, {
    amount: input.amount,
    reason: input.reason,
  });
  db.appendAudit({
    runId: input.runId,
    ...actor("HR"),
    action: `Edited a deduction → ${input.amount} CHF`,
    note: input.reason,
  });
  await refresh();
}

export async function deleteBonus(runId: string, bonusId: string) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Cannot delete bonus: run is ${run.state}`);
  }
  db.removeBonus(bonusId);
  db.appendAudit({ runId, ...actor("HR"), action: "Removed a bonus" });
  await refresh();
}

export async function deleteDeduction(runId: string, deductionId: string) {
  await init();
  const run = db.getRun(runId);
  if (!run) throw new Error("Run not found");
  if (run.state !== "OPEN") {
    throw new Error(`Cannot delete deduction: run is ${run.state}`);
  }
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
