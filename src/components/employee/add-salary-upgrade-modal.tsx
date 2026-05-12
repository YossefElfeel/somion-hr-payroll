"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { addSalaryUpgrade } from "@/lib/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  currentSalary: number;
}

export function AddSalaryUpgradeModal({
  open,
  onClose,
  employeeId,
  currentSalary,
}: Props) {
  const [newSalaryStr, setNewSalaryStr] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const newSalary = Number(newSalaryStr);
  const validNumber = Number.isFinite(newSalary) && newSalary >= 0;
  const percentChange =
    validNumber && currentSalary > 0
      ? Math.round(((newSalary - currentSalary) / currentSalary) * 100)
      : 0;
  const canSubmit = newSalaryStr.length > 0 && validNumber && newSalary !== currentSalary;

  function reset() {
    setNewSalaryStr("");
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Record Salary Upgrade"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button
            disabled={pending || !canSubmit}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await addSalaryUpgrade({ employeeId, newSalary });
                  reset();
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Save upgrade
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label>Current salary</Label>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {currentSalary.toLocaleString()} CHF
          </div>
        </div>
        <div>
          <Label>New salary (CHF)</Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={newSalaryStr}
            onChange={(e) => setNewSalaryStr(e.target.value)}
            placeholder="Enter new base salary"
          />
        </div>
        {validNumber && newSalaryStr.length > 0 && newSalary !== currentSalary && (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Change:{" "}
            <span
              className={
                percentChange >= 0
                  ? "font-semibold text-emerald-700"
                  : "font-semibold text-red-700"
              }
            >
              {percentChange > 0 ? "+" : ""}
              {percentChange}%
            </span>{" "}
            ({(newSalary - currentSalary).toLocaleString()} CHF)
          </div>
        )}
        <p className="text-xs text-slate-500">
          This adds an entry to the salary upgrade history and updates the
          employee&apos;s base salary used for future payroll runs.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
