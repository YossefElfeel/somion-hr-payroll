// Payroll domain types — single source of truth for the data model.
// Mirrors the spec at .claude/plans/...payrole...md

export type Role = "HR" | "ADMIN" | "FINANCE" | "EMPLOYEE";

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

export type EmailDeliveryStatus = "PENDING" | "SENT" | "FAILED";

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
  // Extended profile fields used by the employee details page. All optional so
  // existing seed data stays valid; sections render gracefully when missing.
  dob?: string;                 // ISO date
  gender?: "Male" | "Female" | "Other";
  nationality?: string;
  nationalId?: string;
  accommodationType?: string;
  taxId?: string;
  postCode?: string;
  address?: string;
  jobTitle?: string;
  employeeType?: "Fulltime" | "Parttime" | "Contractor" | "Intern";
  managerId?: string;
  joinDate?: string;            // ISO date
  workLocation?: "Remote" | "Onsite" | "Hybrid";
  status?: "Active" | "Inactive" | "On leave";
  skills?: string[];
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
  // Tracks whether the payslip email went out after the row was marked PAID.
  // Optional because pre-existing seed rows don't have it.
  payslipEmailStatus?: EmailDeliveryStatus;
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

// ───────────────────────────────────────────────────────────────────────────
// Employee-details-page entities (mostly stub data for the mockup sections)
// ───────────────────────────────────────────────────────────────────────────

export interface SalaryUpgrade {
  id: string;
  employeeId: string;
  date: string;          // ISO
  oldSalary: number;
  newSalary: number;
  percentage: number;    // pre-computed for display
}

export type AttachmentKind =
  | "CONTRACT"
  | "MILITARY"
  | "IDENTITY"
  | "EDUCATION"
  | "OTHER";

export interface Attachment {
  id: string;
  employeeId: string;
  name: string;
  kind: AttachmentKind;
  sizeBytes: number;     // metadata only — file bytes not actually stored
  uploadedAt: string;
}

export interface AttendanceEntry {
  id: string;
  employeeId: string;
  date: string;          // ISO date
  startWork: string;     // "07:32 AM"
  endWork: string;       // "05:21 PM"
  status: "APPROVED" | "LATE";
  logHours: string;      // "10:03:12"
  overtimeMin: number;
  lateMin: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;          // "Public Holiday", "Annual", "Sick", etc.
  dateFrom: string;
  dateTo: string;
  durationDays: number;
  status: "Approved" | "Pending" | "Rejected";
  note?: string;
}

export interface LeaveBalance {
  employeeId: string;
  available: number;     // days
  pending: number;
  booked: number;
  used: number;
  contractDays: number;
}

export interface Project {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  percentComplete: number;   // 0..100
  status: "Approved" | "Testing" | "InProgress" | "Done";
  dueDate: string;
  members: number;
  comments: number;
}

export interface Note {
  id: string;
  employeeId: string;
  title: string;
  body: string;
  createdAt: string;     // ISO
}

export interface EmployeeActivity {
  id: string;
  employeeId: string;
  at: string;            // ISO
  message: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Evaluation system — first-class concept with scorecard + history
// ───────────────────────────────────────────────────────────────────────────

// Five fixed categories shown on every evaluation. Keeping them as a constant
// (not data) so the trend bar can render consistent series across periods.
export const EVALUATION_CATEGORIES = [
  "Performance",
  "Communication",
  "Teamwork",
  "Initiative",
  "Punctuality",
] as const;
export type EvaluationCategory = (typeof EVALUATION_CATEGORIES)[number];

export type EvaluationScore = 1 | 2 | 3 | 4 | 5;

export interface Evaluation {
  id: string;
  employeeId: string;
  periodLabel: string;          // "Q2 2026", "H1 2026", "Annual 2025" — free-form
  evaluatedAt: string;          // ISO
  evaluatedBy: string;          // HR actor name
  scores: Record<EvaluationCategory, EvaluationScore>;
  overall: number;              // average — cached so list/sort doesn't recompute
  strengths: string;
  areasToImprove: string;
  goalsNextPeriod?: string;
  comments?: string;
  emailedTo?: string;
  emailStatus: EmailDeliveryStatus;
}

// ───────────────────────────────────────────────────────────────────────────
// Issued documents — experience certificates and HR letters
// (Evaluation is its own table — see above.)
// ───────────────────────────────────────────────────────────────────────────

export type IssuedDocumentType = "EXPERIENCE_CERTIFICATE" | "HR_LETTER";

export interface ExperienceCertificatePayload {
  position: string;
  startDate: string;        // ISO date
  endDate?: string;         // optional if still employed
  remarks?: string;
}

export interface HRLetterPayload {
  addressedTo: string;      // "To Whom It May Concern" / specific party
  purpose: string;          // "Visa application", "Bank loan"
  body: string;
}

export interface IssuedDocument {
  id: string;
  employeeId: string;
  type: IssuedDocumentType;
  issuedAt: string;
  issuedBy: string;
  subject: string;
  payload: ExperienceCertificatePayload | HRLetterPayload;
  emailedTo?: string;
  emailStatus: EmailDeliveryStatus;
}
