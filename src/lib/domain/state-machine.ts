import type { RunState, EmployeePaymentStatus } from "./types";

// Allowed run-state transitions. Single source of truth.
// Run state is coarse — edits allowed / locked / done. Approval & payment are
// tracked per-employee on RunItem.status, which lets HR submit batches across days.
const RUN_TRANSITIONS: Record<RunState, RunState[]> = {
  OPEN: ["FROZEN"],
  FROZEN: ["OPEN", "CLOSED"],
  CLOSED: [],
};

export function canTransitionRun(from: RunState, to: RunState): boolean {
  return RUN_TRANSITIONS[from].includes(to);
}

export function nextRunStates(from: RunState): RunState[] {
  return RUN_TRANSITIONS[from];
}

// Allowed per-employee transitions.
const EMPLOYEE_TRANSITIONS: Record<EmployeePaymentStatus, EmployeePaymentStatus[]> = {
  DRAFT: ["SUBMITTED", "EXCLUDED"],
  SUBMITTED: ["APPROVED", "CHANGES_NEEDED", "EXCLUDED"],
  CHANGES_NEEDED: ["SUBMITTED", "EXCLUDED"],
  APPROVED: ["IN_FINANCE_QUEUE", "EXCLUDED"],
  // Finance retries until paid — no failure terminal state. If a transfer
  // bounces, finance just keeps the row in IN_FINANCE_QUEUE and retries.
  IN_FINANCE_QUEUE: ["PAID"],
  PAID: [],
  EXCLUDED: ["DRAFT"],
};

export function canTransitionEmployee(
  from: EmployeePaymentStatus,
  to: EmployeePaymentStatus,
): boolean {
  return EMPLOYEE_TRANSITIONS[from].includes(to);
}

// State-driven UI helpers
export function isRunEditable(state: RunState): boolean {
  return state === "OPEN";
}

// A row is "editable" — meaning bonuses/deductions can be added or removed
// for that employee on that run — only when the run is OPEN AND the employee
// hasn't progressed past the editable point yet.
export function isRowEditable(
  runState: RunState,
  rowStatus: EmployeePaymentStatus,
): boolean {
  if (runState !== "OPEN") return false;
  return rowStatus === "DRAFT" || rowStatus === "CHANGES_NEEDED";
}

export function runStateLabel(state: RunState): string {
  return { OPEN: "Open", FROZEN: "Frozen", CLOSED: "Closed" }[state];
}

export function runStateColor(state: RunState): {
  bg: string;
  text: string;
  ring: string;
} {
  return {
    OPEN: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
    FROZEN: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
    CLOSED: { bg: "bg-zinc-100", text: "text-zinc-600", ring: "ring-zinc-200" },
  }[state];
}

export function employeeStatusLabel(status: EmployeePaymentStatus): string {
  return {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    CHANGES_NEEDED: "Changes",
    APPROVED: "Approved",
    IN_FINANCE_QUEUE: "In queue",
    PAID: "Paid",
    EXCLUDED: "Excluded",
  }[status];
}

export function employeeStatusColor(status: EmployeePaymentStatus): {
  bg: string;
  text: string;
} {
  return {
    DRAFT: { bg: "bg-slate-100", text: "text-slate-600" },
    SUBMITTED: { bg: "bg-amber-50", text: "text-amber-700" },
    CHANGES_NEEDED: { bg: "bg-orange-100", text: "text-orange-700" },
    APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700" },
    IN_FINANCE_QUEUE: { bg: "bg-violet-50", text: "text-violet-700" },
    PAID: { bg: "bg-emerald-100", text: "text-emerald-800" },
    EXCLUDED: { bg: "bg-zinc-100", text: "text-zinc-500" },
  }[status];
}
