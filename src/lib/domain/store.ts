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

  // Per-employee profile enrichment. One row per slot in `employees[]` — the
  // index matches. managerIdx points into the same array (or undefined for
  // top-of-tree). Bank info is varied so different employees clearly have
  // different accounts in the UI.
  type ProfileSeed = {
    phone: string;
    dob: string;
    gender: "Male" | "Female" | "Other";
    nationality: string;
    nationalId: string;
    accommodationType: string;
    taxId: string;
    postCode: string;
    address: string;
    jobTitle: string;
    employeeType: "Fulltime" | "Parttime" | "Contractor" | "Intern";
    managerIdx?: number;
    joinDate: string;
    workLocation: "Remote" | "Onsite" | "Hybrid";
    status: "Active" | "Inactive" | "On leave";
    skills: string[];
    bank: {
      bankName: string;
      accountName: string;
      accountNo: string;
      iban: string;
    };
  };
  const PROFILES: ProfileSeed[] = [
    // 0 — Tahsen Khan (Sales / Product Designer). Matches the design mockup.
    {
      phone: "01893531209",
      dob: "2001-05-23",
      gender: "Male",
      nationality: "Egypt",
      nationalId: "200242686565",
      accommodationType: "Company housing",
      taxId: "EG-TAX-200242",
      postCode: "31001",
      address: "Sylhet city",
      jobTitle: "Product Designer",
      employeeType: "Fulltime",
      managerIdx: 6, // David Warner
      joinDate: "2024-01-02",
      workLocation: "Remote",
      status: "Active",
      skills: ["UI Design", "Product Design", "Website Design", "Webapp Design", "Dashboard Design"],
      bank: {
        bankName: "CIB Bank",
        accountName: "Tahsen Khan",
        accountNo: "64736457588436478",
        iban: "EG93 0076 2011 6238 5295 7",
      },
    },
    // 1 — Harry Kane (Sales)
    {
      phone: "+44 7700 900111",
      dob: "1993-07-28",
      gender: "Male",
      nationality: "United Kingdom",
      nationalId: "GB-PA-447928112",
      accommodationType: "Private rental",
      taxId: "QQ-12-34-56-A",
      postCode: "E1 6AN",
      address: "12 Old Street, London",
      jobTitle: "Senior Sales Executive",
      employeeType: "Fulltime",
      managerIdx: 6,
      joinDate: "2022-03-15",
      workLocation: "Hybrid",
      status: "Active",
      skills: ["Negotiation", "Outbound", "Account Management", "Salesforce"],
      bank: {
        bankName: "Barclays",
        accountName: "Harry Kane",
        accountNo: "20583946",
        iban: "GB29 BARC 2058 3946 1234 56",
      },
    },
    // 2 — Jaman Khan (Engineering manager)
    {
      phone: "+880 1711 020303",
      dob: "1988-11-12",
      gender: "Male",
      nationality: "Bangladesh",
      nationalId: "BD-1988-04123",
      accommodationType: "Owned",
      taxId: "BD-NBR-99812",
      postCode: "1212",
      address: "House 14, Road 11, Banani, Dhaka",
      jobTitle: "Engineering Manager",
      employeeType: "Fulltime",
      // No managerIdx — top of engineering tree.
      joinDate: "2019-08-01",
      workLocation: "Hybrid",
      status: "Active",
      skills: ["Team leadership", "System design", "TypeScript", "AWS", "Hiring"],
      bank: {
        bankName: "BRAC Bank",
        accountName: "Jaman Khan",
        accountNo: "152034201199",
        iban: "BD15 BRAC 1520 3420 1199 88",
      },
    },
    // 3 — Joe Root (Engineering)
    {
      phone: "+44 7700 900222",
      dob: "1990-12-30",
      gender: "Male",
      nationality: "United Kingdom",
      nationalId: "GB-PA-447902223",
      accommodationType: "Private rental",
      taxId: "WS-44-22-11-B",
      postCode: "S1 2HE",
      address: "44 Westfield Road, Sheffield",
      jobTitle: "Senior Software Engineer",
      employeeType: "Fulltime",
      managerIdx: 2,
      joinDate: "2021-06-14",
      workLocation: "Remote",
      status: "Active",
      skills: ["TypeScript", "Next.js", "PostgreSQL", "Distributed systems"],
      bank: {
        bankName: "Lloyds",
        accountName: "Joe Root",
        accountNo: "11445566",
        iban: "GB29 LOYD 3098 1234 5678 90",
      },
    },
    // 4 — Jaman Roy (Operations lead)
    {
      phone: "+880 1711 040404",
      dob: "1989-04-04",
      gender: "Male",
      nationality: "Bangladesh",
      nationalId: "BD-1989-08741",
      accommodationType: "Owned",
      taxId: "BD-NBR-77234",
      postCode: "1207",
      address: "Block C, Mirpur, Dhaka",
      jobTitle: "Operations Lead",
      employeeType: "Fulltime",
      joinDate: "2020-02-10",
      workLocation: "Onsite",
      status: "Active",
      skills: ["Process design", "Vendor management", "Excel", "Procurement"],
      bank: {
        bankName: "Eastern Bank",
        accountName: "Jaman Roy",
        accountNo: "390202010044",
        iban: "BD93 EBL 3902 0201 0044 11",
      },
    },
    // 5 — James Henry (Operations)
    {
      phone: "+1 415 555 0156",
      dob: "1992-09-19",
      gender: "Male",
      nationality: "United States",
      nationalId: "US-555-12-3456",
      accommodationType: "Private rental",
      taxId: "555-12-3456",
      postCode: "94110",
      address: "1812 Valencia St, San Francisco, CA",
      jobTitle: "Operations Analyst",
      employeeType: "Fulltime",
      managerIdx: 4,
      joinDate: "2023-05-22",
      workLocation: "Remote",
      status: "Active",
      skills: ["Data analysis", "SQL", "Operations research", "Tableau"],
      bank: {
        bankName: "Wells Fargo",
        accountName: "James Henry",
        accountNo: "9001020304",
        iban: "US98 WFGO 9001 0203 0411 22",
      },
    },
    // 6 — David Warner (Sales manager)
    {
      phone: "+61 412 345 678",
      dob: "1986-10-27",
      gender: "Male",
      nationality: "Australia",
      nationalId: "AU-PA-99012345",
      accommodationType: "Owned",
      taxId: "AU-TFN-321098765",
      postCode: "2000",
      address: "55 George Street, Sydney NSW",
      jobTitle: "Head of Sales",
      employeeType: "Fulltime",
      joinDate: "2018-11-05",
      workLocation: "Hybrid",
      status: "Active",
      skills: ["Sales strategy", "Forecasting", "Pipeline ops", "Coaching", "HubSpot"],
      bank: {
        bankName: "Commonwealth Bank",
        accountName: "David Warner",
        accountNo: "06210123456",
        iban: "AU49 CBA 06210 1234 5612",
      },
    },
    // 7 — Harry Brooks (Engineering)
    {
      phone: "+44 7700 900333",
      dob: "1996-08-06",
      gender: "Male",
      nationality: "United Kingdom",
      nationalId: "GB-PA-447902113",
      accommodationType: "Private rental",
      taxId: "RR-22-33-44-C",
      postCode: "M1 5DD",
      address: "9 Whitworth Street, Manchester",
      jobTitle: "Backend Engineer",
      employeeType: "Fulltime",
      managerIdx: 2,
      joinDate: "2023-09-01",
      workLocation: "Remote",
      status: "Active",
      skills: ["Go", "PostgreSQL", "Kafka", "Kubernetes"],
      bank: {
        bankName: "HSBC UK",
        accountName: "Harry Brooks",
        accountNo: "70123456",
        iban: "GB29 HBUK 4010 6612 3456 78",
      },
    },
    // 8 — Tim David (Engineering)
    {
      phone: "+65 9123 4567",
      dob: "1994-03-14",
      gender: "Male",
      nationality: "Singapore",
      nationalId: "SG-S9412345A",
      accommodationType: "Private rental",
      taxId: "SG-IRAS-S9412345A",
      postCode: "049315",
      address: "1 Raffles Place, Singapore",
      jobTitle: "Frontend Engineer",
      employeeType: "Fulltime",
      managerIdx: 2,
      joinDate: "2022-08-20",
      workLocation: "Remote",
      status: "Active",
      skills: ["React", "TypeScript", "Tailwind", "Design systems"],
      bank: {
        bankName: "DBS",
        accountName: "Tim David",
        accountNo: "0723456789",
        iban: "SG10 DBSS 0723 4567 8901 22",
      },
    },
    // 9 — Casey Briggs (Design, weekly)
    {
      phone: "+1 312 555 0190",
      dob: "1998-02-22",
      gender: "Female",
      nationality: "United States",
      nationalId: "US-555-99-0042",
      accommodationType: "Shared housing",
      taxId: "555-99-0042",
      postCode: "60607",
      address: "200 W Madison St, Chicago, IL",
      jobTitle: "Visual Designer",
      employeeType: "Parttime",
      managerIdx: 0,
      joinDate: "2024-06-10",
      workLocation: "Remote",
      status: "Active",
      skills: ["Branding", "Illustration", "Figma", "Motion"],
      bank: {
        bankName: "Chase",
        accountName: "Casey Briggs",
        accountNo: "555012345",
        iban: "US98 CHAS 5550 1234 5678 90",
      },
    },
    // 10 — Pat Gibbs (Operations, biweekly) — currently on leave
    {
      phone: "+27 82 555 0123",
      dob: "1985-05-09",
      gender: "Female",
      nationality: "South Africa",
      nationalId: "ZA-8505090123080",
      accommodationType: "Owned",
      taxId: "ZA-SARS-9012345",
      postCode: "8001",
      address: "12 Long Street, Cape Town",
      jobTitle: "Office Manager",
      employeeType: "Fulltime",
      managerIdx: 4,
      joinDate: "2020-10-30",
      workLocation: "Onsite",
      status: "On leave",
      skills: ["Logistics", "Travel coordination", "Vendor relations"],
      bank: {
        bankName: "Standard Bank",
        accountName: "Pat Gibbs",
        accountNo: "120304050607",
        iban: "ZA13 SBZA 1203 0405 0607 80",
      },
    },
    // 11 — Sara Lin (Contractor, hourly)
    {
      phone: "+1 646 555 0181",
      dob: "1997-12-01",
      gender: "Female",
      nationality: "Canada",
      nationalId: "CA-PR-887766554",
      accommodationType: "Private rental",
      taxId: "CA-CRA-887766",
      postCode: "M5H 2N2",
      address: "100 King St W, Toronto, ON",
      jobTitle: "Data Analyst (Contract)",
      employeeType: "Contractor",
      managerIdx: 4,
      joinDate: "2025-09-15",
      workLocation: "Remote",
      status: "Active",
      skills: ["Python", "Pandas", "SQL", "Looker"],
      bank: {
        bankName: "RBC",
        accountName: "Sara Lin",
        accountNo: "002345678",
        iban: "CA12 RBC 0023 4567 8987 65",
      },
    },
  ];

  PROFILES.forEach((p, i) => {
    const { managerIdx, bank, ...rest } = p;
    Object.assign(employees[i], rest, {
      managerId: managerIdx !== undefined ? employees[managerIdx].id : undefined,
      bank,
    });
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

  // Seed rows exercise each spec type at least once so the demo shows them:
  //   FIXED   -> Tahsen's 75 CHF + Mentored bonus
  //   PERCENT -> Tahsen's quarterly perf bonus (5% of 3000 = 150 CHF)
  //   MONTHS  -> Joe Root's half-month bonus (0.5 × 3500 = 1750 CHF)
  //   DAYS    -> Tahsen's 1-day absence deduction (3000 / 30 = 100 CHF)
  const bonuses: Bonus[] = [
    {
      id: id("bon"),
      employeeId: employees[0].id, // Tahsen
      runId: aprilRun.id,
      amount: 75,
      spec: { kind: "FIXED", value: 75 },
      reason: "Quarterly sales target hit",
      createdAt: "2026-04-08T10:00:00Z",
    },
    {
      id: id("bon"),
      employeeId: employees[0].id, // Tahsen
      runId: aprilRun.id,
      amount: 150,
      spec: { kind: "PERCENT", value: 5 },
      reason: "Q1 performance bonus",
      createdAt: "2026-04-15T10:00:00Z",
    },
    {
      id: id("bon"),
      employeeId: employees[0].id, // Tahsen
      runId: aprilRun.id,
      amount: 50,
      spec: { kind: "FIXED", value: 50 },
      reason: "Mentored two new hires",
      createdAt: "2026-04-22T14:30:00Z",
    },
    {
      id: id("bon"),
      employeeId: employees[3].id, // Joe Root (basicSalary 3500)
      runId: aprilRun.id,
      amount: 1750,
      spec: { kind: "MONTHS", value: 0.5 },
      reason: "Half-month bonus for delivery launch",
      createdAt: nowIso(),
    },
  ];

  const deductions: Deduction[] = [
    {
      id: id("ded"),
      employeeId: employees[0].id, // Tahsen — DAYS deduction
      runId: aprilRun.id,
      amount: 100, // 3000 / 30
      spec: { kind: "DAYS", value: 1 },
      reason: "Unauthorised absence (1 day)",
      source: "MANUAL",
      createdAt: nowIso(),
    },
    {
      id: id("ded"),
      employeeId: employees[5].id,
      runId: aprilRun.id,
      amount: 50,
      spec: { kind: "FIXED", value: 50 },
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

  // Mock issued documents so the HR Letters & Certificates section is
  // populated for several employees out of the box. Mix of both document
  // types, varied subjects, dates, and authors. References specific
  // employees by index so the docs land on profiles the user is likely to
  // open during a demo (Tahsen + a few others).
  const issuedDocuments: IssuedDocument[] = [
    // Tahsen Khan — experience certificate (recent)
    {
      id: id("doc"),
      employeeId: employees[0].id,
      type: "EXPERIENCE_CERTIFICATE",
      referenceNumber: "SOMION-EC-2026-0001",
      issuedAt: "2026-04-12T10:30:00Z",
      issuedBy: "Yossef",
      subject: "Experience Certificate — Tahsen Khan",
      payload: {
        position: "Product Designer",
        startDate: "2024-01-02",
        stillEmployed: true,
        reason: "New employer reference",
        remarks:
          "Tahsen has been a key contributor to our design team, leading the design system refresh and mentoring junior designers.",
      },
      emailedTo: employees[0].email,
      emailStatus: "SENT",
    },
    // Tahsen Khan — HR letter for visa
    {
      id: id("doc"),
      employeeId: employees[0].id,
      type: "HR_LETTER",
      referenceNumber: "SOMION-HL-2026-0001",
      issuedAt: "2026-03-20T14:00:00Z",
      issuedBy: "Yossef",
      subject: "HR Letter — Schengen Visa Application",
      payload: {
        addressedTo: "Embassy of Switzerland, Cairo",
        purpose: "Visa application",
        body:
          "This letter confirms that Tahsen Khan is currently employed at Somion as a Product Designer (full-time, monthly salary 3,000 EGP). The employee is travelling to Switzerland on company business from 15 to 22 May 2026 and will return to their post in Cairo upon completion of the trip. The employee's position is fully funded and will be retained on return.",
      },
      emailedTo: employees[0].email,
      emailStatus: "SENT",
    },

    // Harry Kane — HR letter for bank loan
    {
      id: id("doc"),
      employeeId: employees[1].id,
      type: "HR_LETTER",
      referenceNumber: "SOMION-HL-2026-0002",
      issuedAt: "2026-02-14T09:15:00Z",
      issuedBy: "Yossef",
      subject: "HR Letter — Mortgage Application",
      payload: {
        addressedTo: "Barclays Bank, Mortgage Department",
        purpose: "Bank / financial application",
        body:
          "This letter confirms that Harry Kane has been employed at Somion as a Senior Sales Executive since 15 March 2022. The current annual salary is 36,000 CHF, paid monthly, and the employment is on a permanent, full-time basis.",
      },
      emailedTo: employees[1].email,
      emailStatus: "SENT",
    },

    // Jaman Khan — experience certificate
    {
      id: id("doc"),
      employeeId: employees[2].id,
      type: "EXPERIENCE_CERTIFICATE",
      referenceNumber: "SOMION-EC-2026-0002",
      issuedAt: "2026-01-30T11:00:00Z",
      issuedBy: "Yossef",
      subject: "Experience Certificate — Jaman Khan",
      payload: {
        position: "Engineering Manager",
        startDate: "2019-08-01",
        stillEmployed: true,
        reason: "General reference",
        remarks:
          "Jaman has built and led our engineering function from a team of two to fifteen, shipping the booking, payments, and notification platforms.",
      },
      emailedTo: employees[2].email,
      emailStatus: "SENT",
    },

    // Joe Root — HR letter for rental
    {
      id: id("doc"),
      employeeId: employees[3].id,
      type: "HR_LETTER",
      referenceNumber: "SOMION-HL-2026-0003",
      issuedAt: "2026-03-02T16:45:00Z",
      issuedBy: "Yossef",
      subject: "HR Letter — Rental Application",
      payload: {
        addressedTo: "Foxtons, Lettings — Sheffield",
        purpose: "Bank / financial application",
        body:
          "This letter confirms that Joe Root is currently employed at Somion as a Senior Software Engineer on a permanent, full-time basis with an annual salary of 42,000 CHF, paid monthly. Employment is not subject to a fixed end date.",
      },
      emailedTo: employees[3].email,
      emailStatus: "SENT",
    },

    // David Warner — experience certificate (older)
    {
      id: id("doc"),
      employeeId: employees[6].id,
      type: "EXPERIENCE_CERTIFICATE",
      referenceNumber: "SOMION-EC-2025-0001",
      issuedAt: "2025-11-18T13:30:00Z",
      issuedBy: "Yossef",
      subject: "Experience Certificate — David Warner",
      payload: {
        position: "Head of Sales",
        startDate: "2018-11-05",
        stillEmployed: true,
        reason: "New employer reference",
        remarks:
          "David has consistently exceeded annual revenue targets and built our enterprise sales motion from the ground up.",
      },
      emailedTo: employees[6].email,
      emailStatus: "SENT",
    },

    // Tim David — HR letter for visa
    {
      id: id("doc"),
      employeeId: employees[8].id,
      type: "HR_LETTER",
      referenceNumber: "SOMION-HL-2026-0004",
      issuedAt: "2026-04-05T08:00:00Z",
      issuedBy: "Yossef",
      subject: "HR Letter — UK Business Visa",
      payload: {
        addressedTo: "UK Visas and Immigration",
        purpose: "Visa application",
        body:
          "This letter confirms that Tim David is employed at Somion as a Frontend Engineer (full-time, permanent). The employee will attend the React London conference from 4 to 6 June 2026 on company sponsorship and will return to their post in Singapore immediately afterwards.",
      },
      emailedTo: employees[8].email,
      emailStatus: "SENT",
    },

    // Pat Gibbs — HR letter relating to leave (matches her On leave status)
    {
      id: id("doc"),
      employeeId: employees[10].id,
      type: "HR_LETTER",
      referenceNumber: "SOMION-HL-2026-0005",
      issuedAt: "2026-04-25T10:00:00Z",
      issuedBy: "Yossef",
      subject: "HR Letter — Medical Leave Confirmation",
      payload: {
        addressedTo: "Discovery Health, Cape Town",
        purpose: "Bank / financial application",
        body:
          "This letter confirms that Pat Gibbs is currently on approved medical leave from Somion, in line with company leave policy. Their position as Office Manager is fully retained, and they are expected to return to their post on 13 November 2025.",
      },
      emailedTo: employees[10].email,
      emailStatus: "SENT",
    },

    // Sara Lin — experience certificate (contractor, ended)
    {
      id: id("doc"),
      employeeId: employees[11].id,
      type: "EXPERIENCE_CERTIFICATE",
      referenceNumber: "SOMION-EC-2026-0003",
      issuedAt: "2026-04-28T15:00:00Z",
      issuedBy: "Yossef",
      subject: "Experience Certificate — Sara Lin (Contract)",
      payload: {
        position: "Data Analyst (Contract)",
        startDate: "2025-09-15",
        stillEmployed: false,
        endDate: "2026-04-15",
        reason: "New employer reference",
        remarks:
          "Engaged on a fixed-scope contract delivering revenue and operations dashboards. References available on request.",
      },
      emailedTo: employees[11].email,
      emailStatus: "SENT",
    },

    // One PENDING email so the demo shows the in-flight state
    {
      id: id("doc"),
      employeeId: employees[5].id,
      type: "HR_LETTER",
      referenceNumber: "SOMION-HL-2026-0006",
      issuedAt: new Date(Date.now() - 5_000).toISOString(),
      issuedBy: "Yossef",
      subject: "HR Letter — Apartment Lease Renewal",
      payload: {
        addressedTo: "Property Manager — Valencia Apartments",
        purpose: "Bank / financial application",
        body:
          "This letter confirms that James Henry is currently employed at Somion as an Operations Analyst on a permanent, full-time basis.",
      },
      emailedTo: employees[5].email,
      emailStatus: "PENDING",
    },
  ];

  // ── Mock data for the other 11 employees so every profile renders full ──
  // Pat Gibbs is "On leave", so they get a `Pending` annual-leave row to
  // explain the status. Everyone else gets a routine mix of approved time off,
  // recent attendance, one evaluation, role-relevant projects, and notes.

  // Helper: shift a base date by N days as ISO yyyy-mm-dd.
  function addDays(base: string, days: number): string {
    const d = new Date(`${base}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // Role-flavoured project blurbs so each employee's Projects section
  // matches their job rather than copy-pasting "Travel planner".
  const projectsByDept: Record<string, Array<{ title: string; description: string }>> = {
    Sales: [
      { title: "Q2 EMEA pipeline review", description: "Audit top 20 accounts and forecast Q2 close." },
      { title: "Enterprise onboarding playbook", description: "Document the new enterprise account onboarding sequence." },
    ],
    Engineering: [
      { title: "Payments API v2", description: "Migrate to the new payments provider with zero downtime." },
      { title: "Observability rollout", description: "Add OpenTelemetry across the booking service." },
    ],
    Operations: [
      { title: "Vendor consolidation", description: "Reduce SaaS spend by consolidating three duplicate tools." },
      { title: "Office hardware refresh", description: "Replace conference-room AV across the three offices." },
    ],
    Design: [
      { title: "Brand refresh", description: "Refresh the brand system: type, color, illustration." },
      { title: "Onboarding redesign", description: "Cut the time-to-first-value of the signup flow in half." },
    ],
    Contractor: [
      { title: "Revenue dashboard", description: "Build a leadership dashboard for weekly revenue review." },
    ],
  };

  // Skip Tahsen (index 0) — he already has full mock data above.
  for (let i = 1; i < employees.length; i++) {
    const emp = employees[i];
    const baseSalary = emp.basicSalary;
    const baseDate = "2025-08-01"; // anchor for recency
    const empSlug = emp.name.split(" ")[0];

    // Salary upgrades — two historical raises (~10-15% each).
    if (baseSalary > 0) {
      const step1 = Math.round(baseSalary / 1.1);
      const step0 = Math.round(step1 / 1.12);
      salaryUpgrades.push(
        {
          id: id("su"),
          employeeId: emp.id,
          date: addDays(baseDate, -540), // ~18 months ago
          oldSalary: step0,
          newSalary: step1,
          percentage: Math.round(((step1 - step0) / step0) * 100),
        },
        {
          id: id("su"),
          employeeId: emp.id,
          date: addDays(baseDate, -180), // ~6 months ago
          oldSalary: step1,
          newSalary: baseSalary,
          percentage: Math.round(((baseSalary - step1) / step1) * 100),
        },
      );
    }

    // Attachments — contract + identity for everyone; education for fulltime;
    // military service only for Egyptian employees (none here besides Tahsen),
    // so just three baseline docs.
    attachments.push(
      {
        id: id("att"),
        employeeId: emp.id,
        name: `${empSlug.toLowerCase()}-contract.pdf`,
        kind: "CONTRACT",
        sizeBytes: 8_000_000 + i * 250_000,
        uploadedAt: `${emp.joinDate ?? "2024-01-02"}T09:00:00Z`,
      },
      {
        id: id("att"),
        employeeId: emp.id,
        name: `${empSlug.toLowerCase()}-id.pdf`,
        kind: "IDENTITY",
        sizeBytes: 2_500_000,
        uploadedAt: `${emp.joinDate ?? "2024-01-02"}T09:05:00Z`,
      },
    );
    if (emp.employeeType !== "Contractor") {
      attachments.push({
        id: id("att"),
        employeeId: emp.id,
        name: `${empSlug.toLowerCase()}-education.pdf`,
        kind: "EDUCATION",
        sizeBytes: 5_000_000,
        uploadedAt: `${emp.joinDate ?? "2024-01-02"}T09:10:00Z`,
      });
    }

    // Attendance — 6 recent working days with small variance.
    const attendanceDays = [-10, -9, -8, -7, -4, -3];
    attendanceDays.forEach((offset, idx) => {
      const late = idx === 2 || idx === 5;
      attendance.push({
        id: id("att"),
        employeeId: emp.id,
        date: addDays(baseDate, offset),
        startWork: late ? "09:18 AM" : "08:55 AM",
        endWork: "05:30 PM",
        status: late ? "LATE" : "APPROVED",
        logHours: "08:12:00",
        overtimeMin: idx === 0 ? 45 : 0,
        lateMin: late ? 18 : 0,
      });
    });

    // Leave requests — mix of public holiday + one annual leave.
    leaveRequests.push(
      {
        id: id("lr"),
        employeeId: emp.id,
        type: "Public Holiday",
        dateFrom: "2025-12-25",
        dateTo: "2025-12-25",
        durationDays: 1,
        status: "Approved",
        note: "Automatic public holiday: Christmas Day",
      },
      {
        id: id("lr"),
        employeeId: emp.id,
        type: "Public Holiday",
        dateFrom: "2026-01-01",
        dateTo: "2026-01-01",
        durationDays: 1,
        status: "Approved",
        note: "Automatic public holiday: New Year's Day",
      },
      {
        id: id("lr"),
        employeeId: emp.id,
        type: "Annual",
        dateFrom: emp.status === "On leave" ? addDays(baseDate, 90) : addDays(baseDate, -45),
        dateTo: emp.status === "On leave" ? addDays(baseDate, 104) : addDays(baseDate, -41),
        durationDays: emp.status === "On leave" ? 14 : 5,
        status: emp.status === "On leave" ? "Pending" : "Approved",
        note:
          emp.status === "On leave"
            ? "Family medical leave"
            : "Spring holiday",
      },
    );

    leaveBalances.push({
      employeeId: emp.id,
      available: emp.status === "On leave" ? 5 : 17 - (i % 4),
      pending: emp.status === "On leave" ? 14 : 0,
      booked: emp.status === "On leave" ? 0 : 5,
      used: i % 3,
      contractDays: 24,
    });

    // Projects — pick role-relevant blurbs and vary status.
    const blurbs = projectsByDept[emp.department] ?? projectsByDept.Operations;
    const projectStatuses: Project["status"][] = ["InProgress", "Testing", "Approved"];
    blurbs.forEach((b, idx) => {
      projects.push({
        id: id("prj"),
        employeeId: emp.id,
        title: b.title,
        description: b.description,
        percentComplete: 40 + idx * 25,
        status: projectStatuses[idx % projectStatuses.length],
        dueDate: addDays(baseDate, 30 + idx * 14),
        members: 2 + (idx % 3),
        comments: 4 + idx * 3,
      });
    });

    // Notes — half of employees get a short HR note for flavour.
    if (i % 2 === 0) {
      notes.push({
        id: id("note"),
        employeeId: emp.id,
        title: emp.status === "On leave" ? "On leave through summer" : "Solid teammate",
        body:
          emp.status === "On leave"
            ? "Out on approved family medical leave. Cover handed off to Jaman Roy. Pat is reachable for high-priority handover questions via email only."
            : `${empSlug} consistently meets deliverables and is well-regarded by their team. Worth considering for the next leadership development cohort.`,
        createdAt: addDays(baseDate, -120) + "T10:00:00Z",
      });
    }

    // Activity feed — recent stable items.
    employeeActivity.push(
      {
        id: id("act"),
        employeeId: emp.id,
        at: addDays(baseDate, -2) + "T09:00:00Z",
        message: `${emp.name} logged in from a new device.`,
      },
      {
        id: id("act"),
        employeeId: emp.id,
        at: addDays(baseDate, -7) + "T14:32:00Z",
        message: `${emp.name} completed the H1 compliance training.`,
      },
      {
        id: id("act"),
        employeeId: emp.id,
        at: addDays(baseDate, -21) + "T10:15:00Z",
        message: `${emp.name} was added to the ${emp.department} department roster.`,
      },
    );

    // Evaluation — one prior cycle.
    const scoreBase = 3 + ((i * 7) % 3); // 3, 4, or 5 — deterministic spread
    const variance = (n: number) => Math.max(1, Math.min(5, scoreBase + ((n + i) % 3) - 1)) as 1 | 2 | 3 | 4 | 5;
    const scores = {
      Performance: variance(0),
      Communication: variance(1),
      Teamwork: variance(2),
      Initiative: variance(3),
      Punctuality: variance(4),
    };
    const overall =
      (scores.Performance + scores.Communication + scores.Teamwork + scores.Initiative + scores.Punctuality) /
      EVALUATION_CATEGORIES.length;
    evaluations.push({
      id: id("ev"),
      employeeId: emp.id,
      periodLabel: "Q4 2025",
      evaluatedAt: "2026-01-08T09:00:00Z",
      evaluatedBy: "Yossef",
      scores,
      overall,
      strengths:
        overall >= 4
          ? `${empSlug} consistently delivers on commitments and is a strong collaborator across teams.`
          : `${empSlug} is dependable and reliable on assigned work.`,
      areasToImprove:
        overall >= 4
          ? "Take on more ambiguous problems and bring forward proposals proactively."
          : "Improve communication on blockers earlier in the week.",
      goalsNextPeriod: "Pair with a senior on one cross-functional initiative this quarter.",
      emailedTo: emp.email,
      emailStatus: "SENT",
    });
  }

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
  updateBonus(
    bonusId: string,
    patch: Partial<Pick<Bonus, "amount" | "spec" | "reason">>,
  ) {
    const b = s.bonuses.find((x) => x.id === bonusId);
    if (b) Object.assign(b, patch);
    return b ?? null;
  },
  updateDeduction(
    deductionId: string,
    patch: Partial<Pick<Deduction, "amount" | "spec" | "reason">>,
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
  // Generate the next reference number for an issued-document type in a given
  // year. Format: SOMION-{prefix}-{YYYY}-{NNNN}. The counter scans existing
  // refs of the same (type, year) and adds 1, zero-padded to 4 digits.
  nextDocumentReference(type: "EXPERIENCE_CERTIFICATE" | "HR_LETTER", year: number): string {
    const prefix = type === "EXPERIENCE_CERTIFICATE" ? "EC" : "HL";
    const re = new RegExp(`^SOMION-${prefix}-${year}-(\\d+)$`);
    const max = s.issuedDocuments.reduce((acc, d) => {
      if (d.type !== type || !d.referenceNumber) return acc;
      const m = d.referenceNumber.match(re);
      if (!m) return acc;
      const n = parseInt(m[1], 10);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    const next = (max + 1).toString().padStart(4, "0");
    return `SOMION-${prefix}-${year}-${next}`;
  },

  // ── Payslip email status on RunItem ──
  setRunItemPayslipEmailStatus(itemId: string, status: EmailDeliveryStatus) {
    const it = s.runItems.find((x) => x.id === itemId);
    if (it) it.payslipEmailStatus = status;
  },
};

export type Db = typeof db;
