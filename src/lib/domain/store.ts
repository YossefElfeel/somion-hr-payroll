// In-memory store with seed data. Server-only.
// Held on globalThis so HMR and per-route bundles share ONE instance.
// Replace with Postgres (Neon) when implementing for real, per the plan.

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
} from "./types";

interface Store {
  employees: Employee[];
  loans: Loan[];
  runs: PayrollRun[];
  runItems: RunItem[];
  bonuses: Bonus[];
  deductions: Deduction[];
  audit: AuditEntry[];
  freezeSettings: FreezeSettings;
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
    };
  }

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

  return {
    employees,
    loans,
    runs,
    runItems,
    bonuses,
    deductions,
    audit,
    freezeSettings,
    nextId: n,
  };
}

const G = globalThis as unknown as { __somionStore?: Store };
if (!G.__somionStore) G.__somionStore = build();
const s = G.__somionStore;

function id(prefix: string) {
  return `${prefix}_${++s.nextId}`;
}
function nowIso() {
  return new Date().toISOString();
}

export const db = {
  listEmployees: () => [...s.employees],
  getEmployee: (id: string) => s.employees.find((e) => e.id === id) ?? null,

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
};

export type Db = typeof db;
