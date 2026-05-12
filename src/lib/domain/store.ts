// In-memory store with seed data. Server-only.
// Held on globalThis so HMR and per-route bundles share ONE instance.
// Replace with Postgres (Neon) when implementing for real, per the plan.

import { EVALUATION_CATEGORIES } from "./types";
import type {
  AuditEntry,
  Bonus,
  Deduction,
  Employee,
  FreezeSettings,
  Loan,
  PayrollFrequency,
  PayrollRun,
  RunItem,
  RunState,
  EmployeePaymentStatus,
  EmailDeliveryStatus,
  SalaryUpgrade,
  Attachment,
  AttendanceEntry,
  LeaveRequest,
  LeaveBalance,
  Project,
  Note,
  EmployeeActivity,
  Evaluation,
  IssuedDocument,
} from "./types";

export interface Store {
  employees: Employee[];
  loans: Loan[];
  runs: PayrollRun[];
  runItems: RunItem[];
  bonuses: Bonus[];
  deductions: Deduction[];
  audit: AuditEntry[];
  freezeSettings: FreezeSettings;
  // Employee-details-page entities
  salaryUpgrades: SalaryUpgrade[];
  attachments: Attachment[];
  attendance: AttendanceEntry[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  projects: Project[];
  notes: Note[];
  employeeActivity: EmployeeActivity[];
  evaluations: Evaluation[];
  issuedDocuments: IssuedDocument[];
  nextId: number;
}

function build(): Store {
  let n = 0;
  const id = (prefix: string) => `${prefix}_${++n}`;
  const nowIso = () => new Date().toISOString();

  const employees: Employee[] = [
    e("Tahsen Khan", "Sales", 3000, "MONTHLY"),
    e("Harry Kane", "Sales", 3000, "MONTHLY"),
    e("Jaman Khan", "Engineering", 4000, "MONTHLY"),
    e("Joe Root", "Engineering", 3500, "MONTHLY"),
    e("Jaman Roy", "Operations", 3000, "MONTHLY"),
    e("James Henry", "Operations", 3200, "MONTHLY"),
    e("David Warner", "Sales", 3300, "MONTHLY"),
    e("Harry Brooks", "Engineering", 3400, "MONTHLY"),
    e("Tim David", "Engineering", 3000, "MONTHLY"),
    e("Casey Briggs", "Design", 800, "WEEKLY"),
    e("Pat Gibbs", "Operations", 1600, "BIWEEKLY"),
    e("Sara Lin", "Contractor", 0, "HOURLY"),
  ];

  function e(
    name: string,
    department: string,
    basicSalary: number,
    frequency: PayrollFrequency,
  ): Employee {
    const slug = name.toLowerCase().replace(/\s+/g, ".");
    // Lightweight defaults so all employees have something to render in the
    // details page; richer per-employee overrides happen below for Tahsen.
    return {
      id: id("emp"),
      name,
      department,
      email: `${slug}@somion.example`,
      basicSalary,
      payrollFrequency: frequency,
      bank: {
        bankName: "Credit Suisse",
        accountName: name,
        accountNo: "CH9300762011623852957",
        iban: "CH93 0076 2011 6238 5295 7",
      },
      jobTitle: department === "Engineering" ? "Software Engineer" : `${department} Specialist`,
      employeeType: frequency === "HOURLY" ? "Contractor" : "Fulltime",
      joinDate: "2024-01-02",
      workLocation: "Remote",
      status: "Active",
      skills: ["Teamwork", "Communication"],
    };
  }

  // Enrich the first employee with the rich mockup profile so the demo page
  // renders the same data as the design.
  Object.assign(employees[0], {
    avatar: undefined,
    phone: "01893531209",
    dob: "2001-05-23",
    gender: "Male",
    nationality: "Egypt",
    nationalId: "200242686565",
    accommodationType: "Company housing",
    taxId: "—",
    postCode: "31001",
    address: "Sylhet city",
    jobTitle: "Product Designer",
    employeeType: "Fulltime",
    managerId: employees[0].id, // self for demo (mockup shows Tahsen Khan)
    joinDate: "2024-01-02",
    workLocation: "Remote",
    status: "Active",
    skills: ["UI Design", "Product Design", "Website Design", "Webapp Design", "Dashboard Design"],
  });

  const loans: Loan[] = [
    {
      id: id("loan"),
      employeeId: employees[8].id,
      totalAmount: 5000,
      durationMonths: 12,
      monthlyInstallment: 400,
      reason: "Personal — home appliance",
      paidAmount: 2000,
      createdAt: nowIso(),
    },
  ];

  const runs: PayrollRun[] = [
    {
      id: id("run"),
      frequency: "MONTHLY",
      periodKey: "2026-04",
      periodLabel: "April 2026",
      state: "OPEN",
      createdAt: "2026-04-01T00:00:00Z",
    },
    {
      id: id("run"),
      frequency: "MONTHLY",
      periodKey: "2026-03",
      periodLabel: "March 2026",
      state: "CLOSED",
      createdAt: "2026-03-01T00:00:00Z",
    },
  ];

  const aprilRun = runs[0];
  const marchRun = runs[1];

  const runItems: RunItem[] = [];
  for (const emp of employees.filter((x) => x.payrollFrequency === "MONTHLY")) {
    runItems.push({
      id: id("ri"),
      runId: aprilRun.id,
      employeeId: emp.id,
      status: "DRAFT",
    });
    runItems.push({
      id: id("ri"),
      runId: marchRun.id,
      employeeId: emp.id,
      status: "PAID",
      paidAt: "2026-03-31T15:00:00Z",
      // Mark the seeded PAID row as already-emailed so the Payroll History
      // section on the employee details page shows a stable "Sent" badge
      // out of the box. Real new PAID rows go through the proper flow.
      payslipEmailStatus: "SENT",
    });
  }

  const bonuses: Bonus[] = [
    {
      id: id("bon"),
      employeeId: employees[0].id, // Tahsen — first bonus
      runId: aprilRun.id,
      amount: 75,
      reason: "Quarterly sales target hit",
      createdAt: "2026-04-08T10:00:00Z",
    },
    {
      id: id("bon"),
      employeeId: employees[0].id, // Tahsen — second bonus, same month
      runId: aprilRun.id,
      amount: 50,
      reason: "Mentored two new hires",
      createdAt: "2026-04-22T14:30:00Z",
    },
    {
      id: id("bon"),
      employeeId: employees[3].id, // Joe Root
      runId: aprilRun.id,
      amount: 75,
      reason: "Excellent client feedback",
      createdAt: nowIso(),
    },
  ];

  const deductions: Deduction[] = [
    {
      id: id("ded"),
      employeeId: employees[0].id,
      runId: aprilRun.id,
      amount: 50,
      reason: "A deduction of 50 Swiss Francs for delaying tasks",
      source: "MANUAL",
      createdAt: nowIso(),
    },
    {
      id: id("ded"),
      employeeId: employees[5].id,
      runId: aprilRun.id,
      amount: 50,
      reason: "Late arrivals (3x)",
      source: "MANUAL",
      createdAt: nowIso(),
    },
    {
      id: id("ded"),
      employeeId: employees[8].id,
      runId: aprilRun.id,
      amount: 400,
      reason: "Loan installment (auto)",
      source: "LOAN_INSTALLMENT",
      loanId: loans[0].id,
      createdAt: nowIso(),
    },
  ];

  const audit: AuditEntry[] = [
    { id: id("a"), runId: aprilRun.id, at: aprilRun.createdAt, actor: "HR", actorName: "Yossef", action: "Run created" },
    { id: id("a"), runId: marchRun.id, at: "2026-03-01T00:00:00Z", actor: "HR", actorName: "Yossef", action: "Run created" },
    { id: id("a"), runId: marchRun.id, at: "2026-03-25T00:00:00Z", actor: "HR", actorName: "Yossef", action: "Manually frozen" },
    { id: id("a"), runId: marchRun.id, at: "2026-03-26T00:00:00Z", actor: "ADMIN", actorName: "Admin User", action: "Approved all 9 employees" },
    { id: id("a"), runId: marchRun.id, at: "2026-03-31T15:00:00Z", actor: "FINANCE", actorName: "Finance User", action: "All payments confirmed — run closed" },
  ];

  const freezeSettings: FreezeSettings = {
    monthly: { day: 25 },
    biweekly: { day: 13 },
    weekly: { weekday: 5, hour: 18 },
  };

  // ── Employee details page seed data ──
  // Most rows are for the first employee (Tahsen) so the page looks alive.

  const tahsen = employees[0];

  const salaryUpgrades: SalaryUpgrade[] = [
    { id: id("su"), employeeId: tahsen.id, date: "2024-12-16", oldSalary: 2700, newSalary: 3000, percentage: 10 },
    { id: id("su"), employeeId: tahsen.id, date: "2024-12-25", oldSalary: 2300, newSalary: 2500, percentage: 10 },
    { id: id("su"), employeeId: tahsen.id, date: "2025-02-14", oldSalary: 2000, newSalary: 2200, percentage: 10 },
    { id: id("su"), employeeId: tahsen.id, date: "2025-02-21", oldSalary: 1800, newSalary: 2000, percentage: 10 },
  ];

  const attachments: Attachment[] = [
    { id: id("att"), employeeId: tahsen.id, name: "Contract.pdf", kind: "CONTRACT", sizeBytes: 12_000_000, uploadedAt: "2024-01-02T10:00:00Z" },
    { id: id("att"), employeeId: tahsen.id, name: "miliarty service.pdf", kind: "MILITARY", sizeBytes: 12_000_000, uploadedAt: "2024-01-02T10:00:00Z" },
    { id: id("att"), employeeId: tahsen.id, name: "identity id.pdf", kind: "IDENTITY", sizeBytes: 12_000_000, uploadedAt: "2024-01-02T10:00:00Z" },
    { id: id("att"), employeeId: tahsen.id, name: "Educaion.pdf", kind: "EDUCATION", sizeBytes: 12_000_000, uploadedAt: "2024-01-02T10:00:00Z" },
  ];

  const attendance: AttendanceEntry[] = [
    { id: id("att"), employeeId: tahsen.id, date: "2024-12-16", startWork: "07:32 AM", endWork: "05:21 PM", status: "APPROVED", logHours: "10:03:12", overtimeMin: 120, lateMin: 0 },
    { id: id("att"), employeeId: tahsen.id, date: "2024-12-25", startWork: "07:35 AM", endWork: "05:22 PM", status: "APPROVED", logHours: "10:03:13", overtimeMin: 60, lateMin: 0 },
    { id: id("att"), employeeId: tahsen.id, date: "2025-02-14", startWork: "07:38 AM", endWork: "05:23 PM", status: "LATE", logHours: "10:03:14", overtimeMin: 30, lateMin: 5 },
    { id: id("att"), employeeId: tahsen.id, date: "2025-02-21", startWork: "07:40 AM", endWork: "05:24 PM", status: "APPROVED", logHours: "10:03:15", overtimeMin: 120, lateMin: 0 },
    { id: id("att"), employeeId: tahsen.id, date: "2025-03-26", startWork: "07:45 AM", endWork: "05:25 PM", status: "LATE", logHours: "10:03:16", overtimeMin: 60, lateMin: 8 },
    { id: id("att"), employeeId: tahsen.id, date: "2025-03-27", startWork: "07:50 AM", endWork: "05:26 PM", status: "APPROVED", logHours: "10:03:17", overtimeMin: 30, lateMin: 0 },
    { id: id("att"), employeeId: tahsen.id, date: "2025-04-14", startWork: "07:55 AM", endWork: "05:27 PM", status: "LATE", logHours: "10:03:18", overtimeMin: 0, lateMin: 12 },
    { id: id("att"), employeeId: tahsen.id, date: "2025-04-30", startWork: "08:00 AM", endWork: "05:28 PM", status: "APPROVED", logHours: "10:03:19", overtimeMin: 0, lateMin: 0 },
    { id: id("att"), employeeId: tahsen.id, date: "2025-05-01", startWork: "08:05 AM", endWork: "05:29 PM", status: "APPROVED", logHours: "10:03:20", overtimeMin: 0, lateMin: 0 },
  ];

  const leaveRequests: LeaveRequest[] = [
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2024-12-16", dateTo: "2024-12-16", durationDays: 1, status: "Approved", note: "Automatic public holiday: Victory Day" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2024-12-25", dateTo: "2024-12-25", durationDays: 1, status: "Approved", note: "Automatic public holiday: Christmas Day" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2025-02-14", dateTo: "2025-02-14", durationDays: 1, status: "Approved", note: "Automatic public holiday: Shab e Barat" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2025-02-21", dateTo: "2025-02-21", durationDays: 1, status: "Approved", note: "Automatic public holiday: Language Martyrs Day" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2025-03-26", dateTo: "2025-03-26", durationDays: 1, status: "Approved", note: "Automatic public holiday: Independence Day" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2025-03-27", dateTo: "2025-03-27", durationDays: 1, status: "Approved", note: "Automatic public holiday: Laylat al Qadr" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2025-04-14", dateTo: "2025-04-14", durationDays: 1, status: "Approved", note: "Automatic public holiday: Bengali New Year's Day" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2025-04-30", dateTo: "2025-04-30", durationDays: 1, status: "Approved", note: "Automatic public holiday: Eid ul Fitr" },
    { id: id("lr"), employeeId: tahsen.id, type: "Public Holiday", dateFrom: "2025-05-01", dateTo: "2025-05-01", durationDays: 1, status: "Approved", note: "Automatic public holiday: Labor Day / Eid ul Fitr" },
  ];

  const leaveBalances: LeaveBalance[] = [
    { employeeId: tahsen.id, available: 19, pending: 3, booked: 3, used: 0, contractDays: 24 },
  ];

  const projects: Project[] = [
    { id: id("prj"), employeeId: tahsen.id, title: "Travel planner website design", description: "Design a user friendly profile section...", percentComplete: 90, status: "Approved", dueDate: "2024-11-07", members: 3, comments: 12 },
    { id: id("prj"), employeeId: tahsen.id, title: "Travel planner website design", description: "Design a user friendly profile section...", percentComplete: 90, status: "Testing", dueDate: "2024-11-07", members: 3, comments: 12 },
    { id: id("prj"), employeeId: tahsen.id, title: "Travel planner website design", description: "Design a user friendly profile section...", percentComplete: 90, status: "InProgress", dueDate: "2024-11-07", members: 3, comments: 12 },
    { id: id("prj"), employeeId: tahsen.id, title: "Travel planner website design", description: "Design a user friendly profile section...", percentComplete: 90, status: "Testing", dueDate: "2024-11-07", members: 3, comments: 12 },
  ];

  const notes: Note[] = [
    {
      id: id("note"),
      employeeId: tahsen.id,
      title: "Note 1",
      body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Risus commodo viverra maecenas accumsan lacus. Sed lectus vestibulum mais ullamcorper velit sed ullamcorper. Purus ut faucibus pulvinar elementum. Eget aliquet nibh praesent tristique magna sit. Scelerisque purus semper eget duis at tellus at.",
      createdAt: "2026-05-30T10:00:00Z",
    },
  ];

  const employeeActivity: EmployeeActivity[] = [
    { id: id("act"), employeeId: tahsen.id, at: "2025-01-01T14:12:00Z", message: "Tahsen Khan requested a day off for January 15-17" },
    { id: id("act"), employeeId: tahsen.id, at: "2025-01-01T14:11:00Z", message: "Tahsen Khan updated the Marketing Department details." },
    { id: id("act"), employeeId: tahsen.id, at: "2025-01-01T14:10:00Z", message: "Tahsen Khan was mentioned in a team meeting schedule." },
    { id: id("act"), employeeId: tahsen.id, at: "2025-01-01T14:09:00Z", message: "Tahsen Khan completed the onboarding checklist." },
    { id: id("act"), employeeId: tahsen.id, at: "2025-01-01T14:08:00Z", message: "Tahsen Khan added a new schedule: Product Launch Briefing." },
  ];

  // One sample evaluation so the page isn't empty in demo.
  const evaluations: Evaluation[] = [
    {
      id: id("ev"),
      employeeId: tahsen.id,
      periodLabel: "Q1 2026",
      evaluatedAt: "2026-04-01T09:00:00Z",
      evaluatedBy: "Yossef",
      scores: {
        Performance: 5,
        Communication: 4,
        Teamwork: 5,
        Initiative: 4,
        Punctuality: 3,
      },
      overall: (5 + 4 + 5 + 4 + 3) / EVALUATION_CATEGORIES.length,
      strengths: "Strong eye for visual hierarchy. Mentored two junior designers and consistently delivered ahead of schedule.",
      areasToImprove: "Improve punctuality on stand-ups; share work-in-progress earlier.",
      goalsNextPeriod: "Lead the design system refresh; pair weekly with engineering to unblock handoffs.",
      comments: "Great quarter overall.",
      emailedTo: tahsen.email,
      emailStatus: "SENT",
    },
  ];

  // Empty by default — first issued document will come from HR via the new flow.
  const issuedDocuments: IssuedDocument[] = [];

  return {
    employees,
    loans,
    runs,
    runItems,
    bonuses,
    deductions,
    audit,
    freezeSettings,
    salaryUpgrades,
    attachments,
    attendance,
    leaveRequests,
    leaveBalances,
    projects,
    notes,
    employeeActivity,
    evaluations,
    issuedDocuments,
    nextId: n,
  };
}

const G = globalThis as unknown as { __somionStore?: Store };
if (!G.__somionStore) G.__somionStore = build();

// `s` is a Proxy over G.__somionStore so every read in the db methods below
// goes through the *current* snapshot. After persistence.loadStore() swaps
// the underlying object on G, all subsequent `s.bonuses` / `s.runs` reads
// see the loaded data without rebuilding the db object.
const s = new Proxy({} as Store, {
  get(_t, prop: string | symbol) {
    if (!G.__somionStore) G.__somionStore = build();
    return (G.__somionStore as unknown as Record<string | symbol, unknown>)[prop];
  },
  set(_t, prop: string | symbol, value: unknown) {
    if (!G.__somionStore) G.__somionStore = build();
    (G.__somionStore as unknown as Record<string | symbol, unknown>)[prop] = value;
    return true;
  },
});

// Accessors used by the persistence layer. Underscored so it's clear they
// aren't part of the public domain API.
export function _internalGetStore(): Store {
  if (!G.__somionStore) G.__somionStore = build();
  return G.__somionStore;
}
export function _internalSetStore(next: Store) {
  // Forward-compatible: snapshots saved before the employee-details-page
  // entities were added won't have these arrays. Default to [] so the page
  // doesn't crash trying to .filter() undefined.
  G.__somionStore = {
    ...next,
    salaryUpgrades: next.salaryUpgrades ?? [],
    attachments: next.attachments ?? [],
    attendance: next.attendance ?? [],
    leaveRequests: next.leaveRequests ?? [],
    leaveBalances: next.leaveBalances ?? [],
    projects: next.projects ?? [],
    notes: next.notes ?? [],
    employeeActivity: next.employeeActivity ?? [],
    evaluations: next.evaluations ?? [],
    issuedDocuments: next.issuedDocuments ?? [],
  };
}

function id(prefix: string) {
  s.nextId += 1;
  return `${prefix}_${s.nextId}`;
}
function nowIso() {
  return new Date().toISOString();
}

export const db = {
  listEmployees: () => [...s.employees],
  getEmployee: (id: string) => s.employees.find((e) => e.id === id) ?? null,

  addEmployee(input: Omit<Employee, "id">) {
    const emp: Employee = { ...input, id: id("emp") };
    s.employees.push(emp);
    return emp;
  },
  // Generic patcher for top-level Employee fields (excluding `bank`, which is
  // nested — see updateEmployeeBank). Pass any subset of editable fields.
  updateEmployee(empId: string, patch: Partial<Omit<Employee, "id" | "bank">>) {
    const e = s.employees.find((x) => x.id === empId);
    if (e) Object.assign(e, patch);
    return e ?? null;
  },
  updateEmployeeBank(empId: string, bankPatch: Partial<Employee["bank"]>) {
    const e = s.employees.find((x) => x.id === empId);
    if (e) Object.assign(e.bank, bankPatch);
    return e ?? null;
  },
  // Add a salary-upgrade history row AND bump the employee's basicSalary
  // so future runs use the new amount. Percentage is precomputed.
  addSalaryUpgrade(empId: string, newSalary: number) {
    const e = s.employees.find((x) => x.id === empId);
    if (!e) return null;
    const oldSalary = e.basicSalary;
    const percentage =
      oldSalary > 0 ? Math.round(((newSalary - oldSalary) / oldSalary) * 100) : 0;
    const su: SalaryUpgrade = {
      id: id("su"),
      employeeId: empId,
      date: nowIso(),
      oldSalary,
      newSalary,
      percentage,
    };
    s.salaryUpgrades.push(su);
    e.basicSalary = newSalary;
    return su;
  },

  listRuns: (frequency?: PayrollFrequency) =>
    s.runs
      .filter((r) => !frequency || r.frequency === frequency)
      .sort((a, b) => (a.periodKey < b.periodKey ? 1 : -1)),
  getRun: (id: string) => s.runs.find((r) => r.id === id) ?? null,
  getRunByPeriod: (frequency: PayrollFrequency, periodKey: string) =>
    s.runs.find((r) => r.frequency === frequency && r.periodKey === periodKey) ?? null,

  listRunItems: (runId: string) => s.runItems.filter((ri) => ri.runId === runId),
  getRunItem: (runId: string, employeeId: string) =>
    s.runItems.find((ri) => ri.runId === runId && ri.employeeId === employeeId) ?? null,

  listBonuses: (runId: string) => s.bonuses.filter((b) => b.runId === runId),
  listDeductions: (runId: string) => s.deductions.filter((d) => d.runId === runId),
  listAllRunBonusesForEmployee: (runId: string, employeeId: string) =>
    s.bonuses.filter((b) => b.runId === runId && b.employeeId === employeeId),
  listAllRunDeductionsForEmployee: (runId: string, employeeId: string) =>
    s.deductions.filter((d) => d.runId === runId && d.employeeId === employeeId),

  listLoans: (employeeId?: string) =>
    employeeId ? s.loans.filter((l) => l.employeeId === employeeId) : [...s.loans],

  listAudit: (runId: string) =>
    s.audit.filter((a) => a.runId === runId).sort((a, b) => (a.at < b.at ? -1 : 1)),

  freezeSettings: s.freezeSettings,

  addBonus(input: Omit<Bonus, "id" | "createdAt">) {
    const b: Bonus = { ...input, id: id("bon"), createdAt: nowIso() };
    s.bonuses.push(b);
    return b;
  },
  addDeduction(input: Omit<Deduction, "id" | "createdAt">) {
    const d: Deduction = { ...input, id: id("ded"), createdAt: nowIso() };
    s.deductions.push(d);
    return d;
  },
  addLoan(input: Omit<Loan, "id" | "createdAt" | "paidAmount">) {
    const l: Loan = { ...input, id: id("loan"), paidAmount: 0, createdAt: nowIso() };
    s.loans.push(l);
    return l;
  },
  updateLoan(loanId: string, patch: Partial<Pick<Loan, "totalAmount" | "durationMonths" | "monthlyInstallment" | "reason">>) {
    const l = s.loans.find((x) => x.id === loanId);
    if (l) Object.assign(l, patch);
    return l ?? null;
  },
  removeLoan(loanId: string) {
    const i = s.loans.findIndex((x) => x.id === loanId);
    if (i >= 0) s.loans.splice(i, 1);
  },
  getLoan: (loanId: string) => s.loans.find((l) => l.id === loanId) ?? null,
  incrementLoanPaid(loanId: string, amount: number) {
    const l = s.loans.find((x) => x.id === loanId);
    if (l) l.paidAmount = Math.min(l.totalAmount, l.paidAmount + amount);
  },
  removeBonus(bonusId: string) {
    const i = s.bonuses.findIndex((b) => b.id === bonusId);
    if (i >= 0) s.bonuses.splice(i, 1);
  },
  removeDeduction(deductionId: string) {
    const i = s.deductions.findIndex((d) => d.id === deductionId);
    if (i >= 0) s.deductions.splice(i, 1);
  },
  updateBonus(bonusId: string, patch: Partial<Pick<Bonus, "amount" | "reason">>) {
    const b = s.bonuses.find((x) => x.id === bonusId);
    if (b) Object.assign(b, patch);
    return b ?? null;
  },
  updateDeduction(
    deductionId: string,
    patch: Partial<Pick<Deduction, "amount" | "reason">>,
  ) {
    const d = s.deductions.find((x) => x.id === deductionId);
    if (d) Object.assign(d, patch);
    return d ?? null;
  },
  getBonus: (bonusId: string) => s.bonuses.find((b) => b.id === bonusId) ?? null,
  getDeduction: (deductionId: string) =>
    s.deductions.find((d) => d.id === deductionId) ?? null,
  setRunState(runId: string, state: RunState) {
    const r = s.runs.find((x) => x.id === runId);
    if (r) r.state = state;
  },
  createRun(input: {
    frequency: PayrollFrequency;
    periodKey: string;
    periodLabel: string;
  }) {
    const run: PayrollRun = {
      id: id("run"),
      frequency: input.frequency,
      periodKey: input.periodKey,
      periodLabel: input.periodLabel,
      state: "OPEN",
      createdAt: nowIso(),
    };
    s.runs.push(run);
    // Seed run items for every employee on this frequency.
    for (const emp of s.employees.filter((e) => e.payrollFrequency === run.frequency)) {
      s.runItems.push({
        id: id("ri"),
        runId: run.id,
        employeeId: emp.id,
        status: "DRAFT",
      });
    }
    return run;
  },
  attachActiveLoanInstallments(runId: string) {
    const run = s.runs.find((r) => r.id === runId);
    if (!run) return;
    // For every employee on this run with an outstanding loan, add a
    // LOAN_INSTALLMENT deduction line if one isn't already present for this run.
    const items = s.runItems.filter((ri) => ri.runId === runId);
    for (const item of items) {
      const empLoans = s.loans.filter(
        (l) => l.employeeId === item.employeeId && l.paidAmount < l.totalAmount,
      );
      for (const loan of empLoans) {
        const exists = s.deductions.some(
          (d) => d.runId === runId && d.loanId === loan.id && d.source === "LOAN_INSTALLMENT",
        );
        if (!exists) {
          s.deductions.push({
            id: id("ded"),
            runId,
            employeeId: item.employeeId,
            amount: loan.monthlyInstallment,
            reason: "Loan installment (auto)",
            source: "LOAN_INSTALLMENT",
            loanId: loan.id,
            createdAt: nowIso(),
          });
        }
      }
    }
  },
  setRunItemStatus(itemId: string, status: EmployeePaymentStatus, patch: Partial<RunItem> = {}) {
    const it = s.runItems.find((x) => x.id === itemId);
    if (it) {
      it.status = status;
      Object.assign(it, patch);
    }
  },
  appendAudit(entry: Omit<AuditEntry, "id" | "at"> & { at?: string }) {
    const a: AuditEntry = {
      id: id("a"),
      at: entry.at ?? nowIso(),
      runId: entry.runId,
      actor: entry.actor,
      actorName: entry.actorName,
      action: entry.action,
      note: entry.note,
    };
    s.audit.push(a);
    return a;
  },

  // ── Employee details page reads ──
  listEmployeeSalaryUpgrades: (empId: string) =>
    s.salaryUpgrades.filter((u) => u.employeeId === empId).sort((a, b) => (a.date < b.date ? 1 : -1)),
  listEmployeeAttachments: (empId: string) =>
    s.attachments.filter((a) => a.employeeId === empId),
  listEmployeeAttendance: (empId: string) =>
    s.attendance.filter((a) => a.employeeId === empId).sort((a, b) => (a.date < b.date ? 1 : -1)),
  listEmployeeLeaveRequests: (empId: string) =>
    s.leaveRequests.filter((l) => l.employeeId === empId).sort((a, b) => (a.dateFrom < b.dateFrom ? 1 : -1)),
  getEmployeeLeaveBalance: (empId: string) =>
    s.leaveBalances.find((b) => b.employeeId === empId) ?? null,
  listEmployeeProjects: (empId: string) => s.projects.filter((p) => p.employeeId === empId),
  listEmployeeNotes: (empId: string) =>
    s.notes.filter((n) => n.employeeId === empId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  listEmployeeActivity: (empId: string) =>
    s.employeeActivity.filter((a) => a.employeeId === empId).sort((a, b) => (a.at < b.at ? 1 : -1)),

  // ── Cross-run aggregations for the Finance and Payroll History tabs ──
  listAllBonusesForEmployee: (empId: string) =>
    s.bonuses.filter((b) => b.employeeId === empId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  listAllDeductionsForEmployee: (empId: string) =>
    s.deductions.filter((d) => d.employeeId === empId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  // PAID rows for an employee, paired with their PayrollRun, sorted by paidAt desc.
  listPaidRunItemsForEmployee: (empId: string) => {
    const items = s.runItems
      .filter((ri) => ri.employeeId === empId && ri.status === "PAID")
      .sort((a, b) => ((a.paidAt ?? "") < (b.paidAt ?? "") ? 1 : -1));
    return items.map((item) => ({
      item,
      run: s.runs.find((r) => r.id === item.runId)!,
    }));
  },

  // ── Notes CRUD ──
  addNote(input: Omit<Note, "id" | "createdAt">) {
    const n: Note = { ...input, id: id("note"), createdAt: nowIso() };
    s.notes.push(n);
    return n;
  },
  updateNote(noteId: string, patch: Partial<Pick<Note, "title" | "body">>) {
    const n = s.notes.find((x) => x.id === noteId);
    if (n) Object.assign(n, patch);
    return n ?? null;
  },
  removeNote(noteId: string) {
    const i = s.notes.findIndex((n) => n.id === noteId);
    if (i >= 0) s.notes.splice(i, 1);
  },

  // ── Attachments (metadata-only — no real file upload in this demo) ──
  addAttachment(input: Omit<Attachment, "id" | "uploadedAt">) {
    const a: Attachment = { ...input, id: id("att"), uploadedAt: nowIso() };
    s.attachments.push(a);
    return a;
  },
  removeAttachment(attachmentId: string) {
    const i = s.attachments.findIndex((a) => a.id === attachmentId);
    if (i >= 0) s.attachments.splice(i, 1);
  },

  // ── Evaluations ──
  addEvaluation(input: Omit<Evaluation, "id">) {
    const ev: Evaluation = { ...input, id: id("ev") };
    s.evaluations.push(ev);
    return ev;
  },
  setEvaluationEmailStatus(evalId: string, status: EmailDeliveryStatus) {
    const ev = s.evaluations.find((x) => x.id === evalId);
    if (ev) ev.emailStatus = status;
  },
  listEvaluationsForEmployee: (empId: string) =>
    s.evaluations
      .filter((e) => e.employeeId === empId)
      .sort((a, b) => (a.evaluatedAt < b.evaluatedAt ? 1 : -1)),
  getEvaluation: (evalId: string) =>
    s.evaluations.find((e) => e.id === evalId) ?? null,

  // ── Issued documents (experience certificate / HR letter) ──
  addIssuedDocument(input: Omit<IssuedDocument, "id">) {
    const d: IssuedDocument = { ...input, id: id("doc") };
    s.issuedDocuments.push(d);
    return d;
  },
  setIssuedDocumentEmailStatus(docId: string, status: EmailDeliveryStatus) {
    const d = s.issuedDocuments.find((x) => x.id === docId);
    if (d) d.emailStatus = status;
  },
  listIssuedDocumentsForEmployee: (empId: string) =>
    s.issuedDocuments
      .filter((d) => d.employeeId === empId)
      .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1)),
  getIssuedDocument: (docId: string) =>
    s.issuedDocuments.find((d) => d.id === docId) ?? null,

  // ── Payslip email status on RunItem ──
  setRunItemPayslipEmailStatus(itemId: string, status: EmailDeliveryStatus) {
    const it = s.runItems.find((x) => x.id === itemId);
    if (it) it.payslipEmailStatus = status;
  },
};

export type Db = typeof db;
