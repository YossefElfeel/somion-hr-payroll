"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { addLoan } from "@/lib/actions";
import type { Employee } from "@/lib/domain/types";

export function AddLoanModal({
  open,
  onClose,
  employees,
  runId,
}: {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  runId: string;
}) {
  const [empId, setEmpId] = useState("");
  const [total, setTotal] = useState("");
  const [duration, setDuration] = useState("12");
  const [installment, setInstallment] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Auto-compute installment if user enters total + duration
  useEffect(() => {
    const t = Number(total);
    const d = Number(duration);
    if (t > 0 && d > 0) {
      setInstallment(String(Math.round(t / d)));
    }
  }, [total, duration]);

  function reset() {
    setEmpId("");
    setTotal("");
    setDuration("12");
    setInstallment("");
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
      title="Add Loan"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button
            disabled={pending || !empId || !total || !duration || !installment}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await addLoan({
                    runId,
                    employeeId: empId,
                    totalAmount: Number(total),
                    durationMonths: Number(duration),
                    monthlyInstallment: Number(installment),
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
          <Select value={empId} onChange={(e) => setEmpId(e.target.value)}>
            <option value="">Select an Employee...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.department}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Total Loans (CHF)</Label>
          <Input
            type="number"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="e.g. 5000"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Duration (months)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <Label>Paid monthly (CHF)</Label>
            <Input
              type="number"
              value={installment}
              onChange={(e) => setInstallment(e.target.value)}
              placeholder="auto"
            />
          </div>
        </div>
        <div>
          <Label>Loan Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add Loan Reason"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
