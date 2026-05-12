"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Employee } from "@/lib/domain/types";
import { useCurrentRole } from "@/components/shell/role-switcher";
import { EmployeeSection, InfoGrid } from "./section";
import { EditBankInfoModal } from "./edit-bank-info-modal";

export function BankSection({ employee }: { employee: Employee }) {
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);
  const canEdit = role === "HR" || role === "ADMIN";

  return (
    <>
      <EmployeeSection
        title="Bank Information"
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
            { label: "Bank Name", value: employee.bank.bankName },
            { label: "Account no", value: employee.bank.accountNo },
            { label: "Account Name", value: employee.bank.accountName },
            { label: "IBAN Number", value: employee.bank.iban },
            { label: "Bank Code", value: employee.postCode ?? "—" },
            { label: "Currency", value: "EGP" },
            { label: "Payment Cycle", value: payrollLabel(employee.payrollFrequency) },
          ]}
        />
      </EmployeeSection>

      <EditBankInfoModal
        open={open}
        onClose={() => setOpen(false)}
        employee={employee}
      />
    </>
  );
}

function payrollLabel(f: Employee["payrollFrequency"]) {
  return { MONTHLY: "Monthly", BIWEEKLY: "Biweekly", WEEKLY: "Weekly", HOURLY: "Hourly" }[f];
}
