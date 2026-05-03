// Payroll domain types — single source of truth for the data model.
// Mirrors the spec at .claude/plans/...payrole...md

export type Role = "HR" | "ADMIN" | "FINANCE";

export type PayrollFrequency = "MONTHLY" | "BIWEEKLY" | "WEEKLY" | "HOURLY";

// Run-level states are coarse: edits allowed (OPEN), edits locked (FROZEN), terminal (CLOSED).
// Per-employee approval/payment progress lives on RunItem.status — this lets HR submit
// a partial batch for approval without blocking the rest of the run.
export type RunState = "OPEN" | "FROZEN" | "CLOSED";

export type EmployeePaymentStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CHANGES_NEEDED"
  | "APPROVED"
  | "IN_FINANCE_QUEUE"
  | "PAID"
  | "EXCLUDED";

export interface Employee {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  email: string;
  phone?: string;
  basicSalary: number;
  payrollFrequency: PayrollFrequency;
  bank: {
    bankName: string;
    accountName: string;
    accountNo: string;
    iban: string;
  };
}

export interface Bonus {
  id: string;
  employeeId: string;
  runId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Deduction {
  id: string;
  employeeId: string;
  runId: string;
  amount: number;
  reason: string;
  // 'LOAN_INSTALLMENT' deductions are auto-attached by the loan system; users cannot delete them directly.
  source: "MANUAL" | "LOAN_INSTALLMENT" | "EXTRA_LOAN_REPAYMENT";
  loanId?: string;
  createdAt: string;
}

export interface Loan {
  id: string;
  employeeId: string;
  totalAmount: number;
  durationMonths: number;
  monthlyInstallment: number;
  reason: string;
  paidAmount: number;
  createdAt: string;
}

export interface PayrollRun {
  id: string;
  frequency: PayrollFrequency;
  // periodKey: e.g. '2026-04' for monthly, '2026-W17' for weekly, '2026-04A' for biweekly
  periodKey: string;
  periodLabel: string;
  state: RunState;
  createdAt: string;
}

export interface RunItem {
  id: string;
  runId: string;
  employeeId: string;
  status: EmployeePaymentStatus;
  // Admin notes per row (when status is CHANGES_NEEDED)
  changeNote?: string;
  // When the row was selected for payment by HR
  markedForPaymentAt?: string;
  // Finance fields
  paidAt?: string;
}

export interface AuditEntry {
  id: string;
  runId: string;
  at: string;
  actor: Role;
  actorName: string;
  action: string;
  note?: string;
}

export interface FreezeSettings {
  monthly: { day: number | null }; // 1..28 or null = off
  biweekly: { day: number | null }; // 1..13 or null = off
  weekly: { weekday: number | null; hour: number }; // 0..6 (0=Sun) or null = off
}

export interface ComputedTotals {
  basicSalary: number;
  bonusTotal: number;
  deductionTotal: number;
  loanInstallmentTotal: number;
  extraLoanRepaymentTotal: number;
  total: number;
}
