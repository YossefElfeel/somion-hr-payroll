"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { updateDeduction } from "@/lib/actions";
import type { Deduction } from "@/lib/domain/types";

export function EditDeductionModal({
  open,
  onClose,
  runId,
  deduction,
}: {
  open: boolean;
  onClose: () => void;
  runId: string;
  deduction: Deduction | null;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deduction) {
      setAmount(String(deduction.amount));
      setReason(deduction.reason);
      setError(null);
    }
  }, [deduction]);

  if (!deduction) return null;

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
            disabled={pending || !amount || Number(amount) <= 0}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await updateDeduction({
                    runId,
                    deductionId: deduction.id,
                    amount: Number(amount),
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
        <div>
          <Label>Deduction (CHF)</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label>Deduction Reason</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
