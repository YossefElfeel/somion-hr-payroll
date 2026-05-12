"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateEmployeeBank } from "@/lib/actions";
import type { Employee } from "@/lib/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee;
}

export function EditBankInfoModal({ open, onClose, employee }: Props) {
  const [bankName, setBankName] = useState(employee.bank.bankName);
  const [accountName, setAccountName] = useState(employee.bank.accountName);
  const [accountNo, setAccountNo] = useState(employee.bank.accountNo);
  const [iban, setIban] = useState(employee.bank.iban);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Bank Information"
      size="md"
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
                  await updateEmployeeBank(employee.id, {
                    bankName: bankName.trim(),
                    accountName: accountName.trim(),
                    accountNo: accountNo.trim(),
                    iban: iban.trim(),
                  });
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label>Bank Name</Label>
          <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </div>
        <div>
          <Label>Account Name</Label>
          <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        </div>
        <div>
          <Label>Account No</Label>
          <Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} />
        </div>
        <div>
          <Label>IBAN</Label>
          <Input value={iban} onChange={(e) => setIban(e.target.value)} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}
