import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { db } from "@/lib/domain/store";
import { loadStore } from "@/lib/domain/persistence";
import { computeTotals } from "@/lib/domain/totals";
import { EmployeeHeader } from "@/components/employee/employee-header";
import { PersonalInfoSection } from "@/components/employee/personal-info-section";
import { EmployeeInfoSection } from "@/components/employee/employee-info-section";
import { BankSection } from "@/components/employee/bank-section";
import { SalarySection } from "@/components/employee/salary-section";
import { AttachmentsSection } from "@/components/employee/attachments-section";
import { TimeOffAttendanceSection } from "@/components/employee/timeoff-attendance-section";
import { ActivitySection } from "@/components/employee/activity-section";
import { FinanceSection } from "@/components/employee/finance-section";
import { PayrollHistorySection } from "@/components/employee/payroll-history-section";
import { EvaluationsSection } from "@/components/employee/evaluations-section";
import { HRDocumentsSection } from "@/components/employee/hr-documents-section";
import { ProjectsSection } from "@/components/employee/projects-section";
import { NotesSection } from "@/components/employee/notes-section";

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await loadStore();
  const { id } = await params;

  const employee = db.getEmployee(id);
  if (!employee) notFound();

  // Pull every related slice up-front so the page renders in one server pass.
  const salaryUpgrades = db.listEmployeeSalaryUpgrades(id);
  const attachments = db.listEmployeeAttachments(id);
  const attendance = db.listEmployeeAttendance(id);
  const leaveRequests = db.listEmployeeLeaveRequests(id);
  const leaveBalance = db.getEmployeeLeaveBalance(id);
  const activity = db.listEmployeeActivity(id);
  const projects = db.listEmployeeProjects(id);
  const notes = db.listEmployeeNotes(id);
  const evaluations = db.listEvaluationsForEmployee(id);
  const documents = db.listIssuedDocumentsForEmployee(id);

  // Cross-run finance data.
  const allRuns = db.listRuns().filter((r) =>
    db.listRunItems(r.id).some((it) => it.employeeId === id),
  );
  const allItems = allRuns.flatMap((r) =>
    db.listRunItems(r.id).filter((it) => it.employeeId === id),
  );
  const allBonuses = db.listAllBonusesForEmployee(id);
  const allDeductions = db.listAllDeductionsForEmployee(id);
  const loans = db.listLoans(id);

  // Payroll history rows (PAID only) + precomputed net per row so the
  // section component doesn't have to redo the aggregation.
  const paidRows = db.listPaidRunItemsForEmployee(id);
  const netByRunId: Record<string, number> = {};
  for (const { run } of paidRows) {
    const runBonuses = allBonuses.filter((b) => b.runId === run.id);
    const runDeductions = allDeductions.filter((d) => d.runId === run.id);
    netByRunId[run.id] = computeTotals(employee, runBonuses, runDeductions).total;
  }

  const manager = employee.managerId
    ? db.getEmployee(employee.managerId)
    : null;

  // Pass a minimal employee list to the EmployeeInfoSection so its edit
  // modal can render a manager-picker dropdown.
  const allEmployees = db
    .listEmployees()
    .map((e) => ({ id: e.id, name: e.name }));

  return (
    <AppShell title={employee.name}>
      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        <div className="space-y-4">
          <EmployeeHeader employee={employee} />
          <PersonalInfoSection employee={employee} />
          <EmployeeInfoSection
            employee={employee}
            managerName={manager?.name ?? undefined}
            allEmployees={allEmployees}
          />
          <BankSection employee={employee} />
          <SalarySection employee={employee} upgrades={salaryUpgrades} />
          <AttachmentsSection
            employeeId={employee.id}
            attachments={attachments}
          />
          <TimeOffAttendanceSection
            attendance={attendance}
            leaveRequests={leaveRequests}
            leaveBalance={leaveBalance}
          />
          <ActivitySection activity={activity} />
          <FinanceSection
            runs={allRuns}
            items={allItems}
            bonuses={allBonuses}
            deductions={allDeductions}
            loans={loans}
            basicSalary={employee.basicSalary}
          />
          <PayrollHistorySection
            employeeId={employee.id}
            paidRows={paidRows}
            netByRunId={netByRunId}
          />
          <EvaluationsSection
            employeeId={employee.id}
            employeeName={employee.name}
            evaluations={evaluations}
          />
          <HRDocumentsSection
            employeeId={employee.id}
            employeeName={employee.name}
            employeeJobTitle={employee.jobTitle}
            documents={documents}
          />
          <ProjectsSection projects={projects} />
          <NotesSection employeeId={employee.id} notes={notes} />
        </div>
      </div>
    </AppShell>
  );
}
