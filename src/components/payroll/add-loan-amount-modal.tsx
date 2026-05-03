"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { addExtraLoanRepayment } from "@/lib/actions";
import { formatCHF } from "@/lib/domain/totals";
import type { Loan } from "@/lib/domain/types";

export function AddLoanAmountModal({
  open,
  onClose,
  loan,
  runId,
}: {
  open: boolean;
  onClose: () => void;
  loan: Loan | null;
  runId: string;
}) {
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!loan) return null;

  const remaining = loan.totalAmount - loan.paidAmount;
  const remainingAfter =
    amount && !isNaN(Number(amount)) ? remaining - Number(amount) : remaining;

  return (
    <Modal
      open={open}
      onClose={() => {
        setAmount("");
        setError(null);
        onClose();
      }}
      title="Add Amount"
      size="md"
      zIndex={60}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              setAmount("");
              setError(null);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={pending || !amount}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await addExtraLoanRepayment({
                    runId,
                    loanId: loan.id,
                    amount: Number(amount),
                  });
                  setAmount("");
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
          <Label>Total Loans</Label>
          <Input value={formatCHF(loan.totalAmount)} disabled />
        </div>
        <div>
          <Label>Paid monthly</Label>
          <Input value={formatCHF(loan.monthlyInstallment)} disabled />
        </div>
        <div>
          <Label>Added amount (extra one-off repayment)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Remaining Amount</Label>
          <Input value={formatCHF(Math.max(0, remainingAfter))} disabled />
          <p className="mt-1 text-xs text-slate-500">
            Will be calculated automatically once payment confirms.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
