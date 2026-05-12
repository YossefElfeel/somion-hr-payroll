"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { updateEmployeeProfile } from "@/lib/actions";
import type { Employee } from "@/lib/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  // Used to populate the manager dropdown — we can't pick a non-existent
  // employee. The current employee is filtered out client-side below.
  allEmployees: Array<{ id: string; name: string }>;
}

export function EditEmployeeInfoModal({ open, onClose, employee, allEmployees }: Props) {
  const [jobTitle, setJobTitle] = useState(employee.jobTitle ?? "");
  const [employeeType, setEmployeeType] = useState<string>(employee.employeeType ?? "");
  const [managerId, setManagerId] = useState(employee.managerId ?? "");
  const [department, setDepartment] = useState(employee.department);
  const [joinDate, setJoinDate] = useState(employee.joinDate ?? "");
  const [workLocation, setWorkLocation] = useState<string>(employee.workLocation ?? "");
  const [status, setStatus] = useState<string>(employee.status ?? "Active");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canSubmit = department.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Employee Information"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending || !canSubmit}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await updateEmployeeProfile(employee.id, {
                    jobTitle: jobTitle.trim() || undefined,
                    employeeType: (employeeType || undefined) as Employee["employeeType"],
                    managerId: managerId || undefined,
                    department: department.trim(),
                    joinDate: joinDate || undefined,
                    workLocation: (workLocation || undefined) as Employee["workLocation"],
                    status: (status || "Active") as Employee["status"],
                  });
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Job Title</Label>
          <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
        <div>
          <Label>Employee Type</Label>
          <Select value={employeeType} onChange={(e) => setEmployeeType(e.target.value)}>
            <option value="">—</option>
            <option value="Fulltime">Fulltime</option>
            <option value="Parttime">Parttime</option>
            <option value="Contractor">Contractor</option>
            <option value="Intern">Intern</option>
          </Select>
        </div>
        <div>
          <Label>Manager</Label>
          <Select value={managerId} onChange={(e) => setManagerId(e.target.value)}>
            <option value="">— None —</option>
            {allEmployees
              .filter((e) => e.id !== employee.id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
          </Select>
        </div>
        <div>
          <Label>Department</Label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div>
          <Label>Join Date</Label>
          <Input
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
          />
        </div>
        <div>
          <Label>Work Location</Label>
          <Select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)}>
            <option value="">—</option>
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
            <option value="Hybrid">Hybrid</option>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On leave">On leave</option>
          </Select>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
