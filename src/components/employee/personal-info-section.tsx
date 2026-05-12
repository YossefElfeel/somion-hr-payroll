"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Employee } from "@/lib/domain/types";
import { useCurrentRole } from "@/components/shell/role-switcher";
import { EmployeeSection, InfoGrid } from "./section";
import { EditPersonalInfoModal } from "./edit-personal-info-modal";

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

export function PersonalInfoSection({ employee }: { employee: Employee }) {
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);
  const canEdit = role === "HR" || role === "ADMIN";

  return (
    <>
      <EmployeeSection
        title="Personal Information"
        action={
          canEdit ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={12} /> Edit
            </button>
          ) : null
        }
      >
        <InfoGrid
          items={[
            { label: "Full Name", value: employee.name },
            { label: "Date of Birth", value: formatDate(employee.dob) },
            { label: "Gender", value: employee.gender },
            { label: "Nationality", value: employee.nationality },
            { label: "National ID", value: employee.nationalId },
            { label: "Accommodation type", value: employee.accommodationType },
            { label: "Email Address", value: employee.email },
            { label: "Phone Number", value: employee.phone },
            { label: "Personal Tax ID", value: employee.taxId },
            { label: "Post Code", value: employee.postCode },
            { label: "Address", value: employee.address },
          ]}
        />
      </EmployeeSection>

      <EditPersonalInfoModal
        open={open}
        onClose={() => setOpen(false)}
        employee={employee}
      />
    </>
  );
}
