"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { addEmployee } from "@/lib/actions";
import type { PayrollFrequency } from "@/lib/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddEmployeeModal({ open, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [salaryStr, setSalaryStr] = useState("");
  const [frequency, setFrequency] = useState<PayrollFrequency>("MONTHLY");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const salary = Number(salaryStr);
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    Number.isFinite(salary) &&
    salary >= 0;

  function reset() {
    setName("");
    setEmail("");
    setDepartment("");
    setJobTitle("");
    setSalaryStr("");
    setFrequency("MONTHLY");
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Add New Employee"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button
            disabled={pending || !canSubmit}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  const emp = await addEmployee({
                    name,
                    email,
                    department,
                    jobTitle: jobTitle || undefined,
                    basicSalary: salary,
                    payrollFrequency: frequency,
                  });
                  reset();
                  onClose();
                  // Drop the user straight into the new employee's profile
                  // so they can fill in the rest of the fields right away.
                  router.push(`/employees/${emp.id}`);
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label>Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane.doe@somion.example"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Department</Label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
            />
          </div>
          <div>
            <Label>Job Title</Label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Software Engineer"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Base Salary (CHF)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={salaryStr}
              onChange={(e) => setSalaryStr(e.target.value)}
              placeholder="3000"
            />
          </div>
          <div>
            <Label>Payroll Frequency</Label>
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value as PayrollFrequency)}>
              <option value="MONTHLY">Monthly</option>
              <option value="BIWEEKLY">Biweekly</option>
              <option value="WEEKLY">Weekly</option>
              <option value="HOURLY">Hourly</option>
            </Select>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          You can fill in personal details, bank info, attachments, and skills
          on the next screen after creating the employee.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
