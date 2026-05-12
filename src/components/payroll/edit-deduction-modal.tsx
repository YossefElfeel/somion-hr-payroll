"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { updateDeduction } from "@/lib/actions";
import type { AmountKind, Deduction, Employee } from "@/lib/domain/types";
import { AmountSpecInput } from "./amount-spec-input";

export function EditDeductionModal({
  open,
  onClose,
  runId,
  deduction,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  runId: string;
  deduction: Deduction | null;
  employees: Employee[];
}) {
  const [kind, setKind] = useState<AmountKind>("FIXED");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deduction) return;
    if (deduction.spec) {
      setKind(deduction.spec.kind);
      setValue(String(deduction.spec.value));
    } else {
      setKind("FIXED");
      setValue(String(deduction.amount));
    }
    setReason(deduction.reason);
    setError(null);
  }, [deduction]);

  if (!deduction) return null;

  const employee = employees.find((e) => e.id === deduction.employeeId) ?? null;
  const numericValue = Number(value);
  const validValue =
    value.length > 0 && Number.isFinite(numericValue) && numericValue > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Deduction"
      size="md"
      zIndex={60}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending || !validValue}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await updateDeduction({
                    runId,
                    deductionId: deduction.id,
                    spec: { kind, value: numericValue },
                    reason,
                  });
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <AmountSpecInput
          basicSalary={employee?.basicSalary ?? null}
          kind={kind}
          value={value}
          onKindChange={setKind}
          onValueChange={setValue}
          label="Deduction"
        />
        <div>
          <Label>Deduction Reason</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
