"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateLoan } from "@/lib/actions";
import type { Loan } from "@/lib/domain/types";

export function EditLoanModal({
  open,
  onClose,
  loan,
}: {
  open: boolean;
  onClose: () => void;
  loan: Loan | null;
}) {
  const [total, setTotal] = useState("");
  const [duration, setDuration] = useState("");
  const [installment, setInstallment] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loan) {
      setTotal(String(loan.totalAmount));
      setDuration(String(loan.durationMonths));
      setInstallment(String(loan.monthlyInstallment));
      setError(null);
    }
  }, [loan]);

  if (!loan) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Loan"
      size="md"
      zIndex={60}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await updateLoan({
                    loanId: loan.id,
                    totalAmount: Number(total),
                    durationMonths: Number(duration),
                    monthlyInstallment: Number(installment),
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
          <Label>Total Loans (CHF)</Label>
          <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Duration (months)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <Label>Paid monthly (CHF)</Label>
            <Input
              type="number"
              value={installment}
              onChange={(e) => setInstallment(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-amber-700">
          Changes only affect future runs. Already-paid installments are not modified.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
