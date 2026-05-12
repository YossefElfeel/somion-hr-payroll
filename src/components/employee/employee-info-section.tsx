"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Employee } from "@/lib/domain/types";
import { useCurrentRole } from "@/components/shell/role-switcher";
import { EmployeeSection, InfoGrid } from "./section";
import { EditEmployeeInfoModal } from "./edit-employee-info-modal";

function formatDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function EmployeeInfoSection({
  employee,
  managerName,
  allEmployees,
}: {
  employee: Employee;
  managerName?: string;
  allEmployees: Array<{ id: string; name: string }>;
}) {
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);
  const canEdit = role === "HR" || role === "ADMIN";

  return (
    <>
      <EmployeeSection
        title="Employee Information"
        action={
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={12} /> Edit
              </button>
            )}
            <a
              href={`mailto:${employee.email}`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Send Email
            </a>
          </div>
        }
      >
        <InfoGrid
          items={[
            { label: "Employee ID", value: employee.id },
            { label: "Job Title", value: employee.jobTitle },
            { label: "Employee Type", value: employee.employeeType },
            { label: "Manager", value: managerName },
            { label: "Department", value: employee.department },
            { label: "Join Date", value: formatDate(employee.joinDate) },
            { label: "Work Location", value: employee.workLocation },
            { label: "Status", value: employee.status },
          ]}
        />
      </EmployeeSection>

      <EditEmployeeInfoModal
        open={open}
        onClose={() => setOpen(false)}
        employee={employee}
        allEmployees={allEmployees}
      />
    </>
  );
}
