"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { issueHRLetter } from "@/lib/actions";
import { ReasonPicker } from "./reason-picker";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

export function IssueHRLetterModal({
  open,
  onClose,
  employeeId,
  employeeName,
}: Props) {
  const [addressedTo, setAddressedTo] = useState("To Whom It May Concern");
  const [purpose, setPurpose] = useState("General reference");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAddressedTo("To Whom It May Concern");
    setPurpose("General reference");
    setBody("");
    setError(null);
  }, [open]);

  const validationError = (() => {
    if (addressedTo.trim().length === 0) return "'Addressed to' is required.";
    if (purpose.trim().length === 0) return "Pick or describe a purpose.";
    if (body.trim().length === 0) return "Letter body is required.";
    return null;
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Issue HR Letter — ${employeeName}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending || !!validationError}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await issueHRLetter({
                    employeeId,
                    addressedTo: addressedTo.trim(),
                    purpose: purpose.trim(),
                    body: body.trim(),
                  });
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Issue & send
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Addressed to</Label>
          <Input
            type="text"
            value={addressedTo}
            onChange={(e) => setAddressedTo(e.target.value)}
            placeholder="To Whom It May Concern / Bank XYZ / Embassy of …"
          />
        </div>

        <ReasonPicker
          value={purpose}
          onChange={setPurpose}
          label="Purpose"
          otherPlaceholder="e.g. Confirmation of bonus structure for tax return"
        />

        <div>
          <Label>Body</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the letter body. Include any specifics — dates, salary, role, etc."
            rows={7}
          />
        </div>

        {validationError && (
          <p className="text-xs text-amber-700">{validationError}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
