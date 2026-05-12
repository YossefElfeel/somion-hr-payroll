"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { updateBonus } from "@/lib/actions";
import type { AmountKind, Bonus, Employee } from "@/lib/domain/types";
import { AmountSpecInput } from "./amount-spec-input";

export function EditBonusModal({
  open,
  onClose,
  runId,
  bonus,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  runId: string;
  bonus: Bonus | null;
  // Needed to resolve the employee's basicSalary for the live preview.
  employees: Employee[];
}) {
  const [kind, setKind] = useState<AmountKind>("FIXED");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever the modal targets a new bonus. Legacy rows (no spec)
  // get FIXED with the stored CHF amount so HR can still edit cleanly.
  useEffect(() => {
    if (!bonus) return;
    if (bonus.spec) {
      setKind(bonus.spec.kind);
      setValue(String(bonus.spec.value));
    } else {
      setKind("FIXED");
      setValue(String(bonus.amount));
    }
    setReason(bonus.reason);
    setError(null);
  }, [bonus]);

  if (!bonus) return null;

  const employee = employees.find((e) => e.id === bonus.employeeId) ?? null;
  const numericValue = Number(value);
  const validValue =
    value.length > 0 && Number.isFinite(numericValue) && numericValue > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Bonus"
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
                  await updateBonus({
                    runId,
                    bonusId: bonus.id,
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
          label="Bonus"
        />
        <div>
          <Label>Bonus Reason</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
