"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { addBonus } from "@/lib/actions";
import type { AmountKind, Employee } from "@/lib/domain/types";
import { AmountSpecInput } from "./amount-spec-input";

export function AddBonusModal({
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
  const [kind, setKind] = useState<AmountKind>("FIXED");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Re-sync the prefilled employee whenever the modal re-opens with a new default.
  useEffect(() => {
    if (open && defaultEmployeeId) setEmpId(defaultEmployeeId);
  }, [open, defaultEmployeeId]);

  function reset() {
    setEmpId(defaultEmployeeId ?? "");
    setKind("FIXED");
    setValue("");
    setReason("");
    setError(null);
  }

  const selectedEmployee = employees.find((e) => e.id === empId) ?? null;
  const numericValue = Number(value);
  const validValue =
    value.length > 0 && Number.isFinite(numericValue) && numericValue > 0;
  const canSubmit = !!empId && validValue;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add Bonus"
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
            disabled={pending || !canSubmit}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await addBonus({
                    runId,
                    employeeId: empId,
                    spec: { kind, value: numericValue },
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

        <AmountSpecInput
          basicSalary={selectedEmployee?.basicSalary ?? null}
          kind={kind}
          value={value}
          onKindChange={setKind}
          onValueChange={setValue}
          label="Bonus"
        />

        <div>
          <Label>Bonus Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add Bonus Reason"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </Modal>
  );
}
