"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { addDeduction } from "@/lib/actions";
import type { Employee } from "@/lib/domain/types";

export function AddDeductionModal({
  open,
  onClose,
  runId,
  employees,
  defaultEmployeeId,
}: {
  open: boolean;
  onClose: () => void;
  runId: string;
  employees: Employee[];
  defaultEmployeeId?: string;
}) {
  const [empId, setEmpId] = useState(defaultEmployeeId ?? "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && defaultEmployeeId) setEmpId(defaultEmployeeId);
  }, [open, defaultEmployeeId]);

  function reset() {
    setEmpId(defaultEmployeeId ?? "");
    setAmount("");
    setReason("");
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add Deduction"
      size="md"
      zIndex={60}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={pending || !empId || !amount || Number(amount) <= 0}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await addDeduction({
                    runId,
                    employeeId: empId,
                    amount: Number(amount),
                    reason,
                  });
                  reset();
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Add
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Employee</Label>
          <Select
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            disabled={employees.length === 0 || !!defaultEmployeeId}
          >
            <option value="">
              {employees.length === 0
                ? "No editable employees in this run"
                : "Select an Employee..."}
            </option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.department}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Deductions (CHF)</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter Deductions Amount"
          />
        </div>
        <div>
          <Label>Deductions Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add Deductions Reason"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
