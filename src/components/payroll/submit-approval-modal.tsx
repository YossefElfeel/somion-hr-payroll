"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { submitForApproval } from "@/lib/actions";
import { formatCHF } from "@/lib/domain/totals";

export function SubmitApprovalModal({
  open,
  onClose,
  runId,
  rows,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  runId: string;
  rows: { employeeId: string; name: string; total: number }[];
  onSubmitted?: () => void;
}) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const totalAmount = rows.reduce((s, r) => s + r.total, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Submit ${rows.length} employees for approval`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending || rows.length === 0}
            onClick={() => {
              startTransition(async () => {
                await submitForApproval(
                  runId,
                  rows.map((r) => r.employeeId),
                  note || undefined,
                );
                setNote("");
                onSubmitted?.();
                onClose();
              });
            }}
          >
            Submit to Admin
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-slate-200">
          <div className="max-h-60 overflow-y-auto">
            {rows.map((r) => (
              <div
                key={r.employeeId}
                className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-b-0"
              >
                <span className="text-slate-700">{r.name}</span>
                <span className="font-medium text-slate-900">
                  {formatCHF(r.total)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium text-slate-700">Total payout</span>
            <span className="font-semibold text-slate-900">
              {formatCHF(totalAmount)}
            </span>
          </div>
        </div>
        <div>
          <Label>Note to admin (optional)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the admin should know"
          />
        </div>
      </div>
    </Modal>
  );
}
