"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { issueDocument } from "@/lib/actions";
import type {
  ExperienceCertificatePayload,
  HRLetterPayload,
  IssuedDocumentType,
} from "@/lib/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  employeeJobTitle?: string;
}

export function IssueDocumentModal({
  open,
  onClose,
  employeeId,
  employeeName,
  employeeJobTitle,
}: Props) {
  const [type, setType] = useState<IssuedDocumentType>("EXPERIENCE_CERTIFICATE");
  const [subject, setSubject] = useState("");

  // Experience certificate fields
  const [position, setPosition] = useState(employeeJobTitle ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // HR letter fields
  const [addressedTo, setAddressedTo] = useState("To Whom It May Concern");
  const [purpose, setPurpose] = useState("");
  const [body, setBody] = useState("");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType("EXPERIENCE_CERTIFICATE");
    setSubject("");
    setPosition(employeeJobTitle ?? "");
    setStartDate("");
    setEndDate("");
    setRemarks("");
    setAddressedTo("To Whom It May Concern");
    setPurpose("");
    setBody("");
    setError(null);
  }

  const canSubmit = (() => {
    if (subject.trim().length === 0) return false;
    if (type === "EXPERIENCE_CERTIFICATE") {
      return position.trim().length > 0 && startDate.length > 0;
    }
    return purpose.trim().length > 0 && body.trim().length > 0 && addressedTo.trim().length > 0;
  })();

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Issue Document — ${employeeName}`}
      size="lg"
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
                  const payload: ExperienceCertificatePayload | HRLetterPayload =
                    type === "EXPERIENCE_CERTIFICATE"
                      ? {
                          position: position.trim(),
                          startDate,
                          endDate: endDate || undefined,
                          remarks: remarks.trim() || undefined,
                        }
                      : {
                          addressedTo: addressedTo.trim(),
                          purpose: purpose.trim(),
                          body: body.trim(),
                        };
                  await issueDocument({
                    employeeId,
                    type,
                    subject: subject.trim(),
                    payload,
                  });
                  reset();
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
          <Label>Document type</Label>
          <div className="grid grid-cols-2 gap-2">
            <TypeCard
              active={type === "EXPERIENCE_CERTIFICATE"}
              title="Experience Certificate"
              hint="Confirms employment, position, and dates."
              onClick={() => setType("EXPERIENCE_CERTIFICATE")}
            />
            <TypeCard
              active={type === "HR_LETTER"}
              title="HR Letter"
              hint="For visa, bank, or embassy requests."
              onClick={() => setType("HR_LETTER")}
            />
          </div>
        </div>

        <div>
          <Label>Subject</Label>
          <Input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={
              type === "EXPERIENCE_CERTIFICATE"
                ? "e.g. Experience Certificate — Tahsen Khan"
                : "e.g. HR Letter — Bank loan application"
            }
          />
        </div>

        {type === "EXPERIENCE_CERTIFICATE" ? (
          <>
            <div>
              <Label>Position</Label>
              <Input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Product Designer"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End date (optional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Remarks (optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Anything else worth noting"
                rows={3}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Addressed to</Label>
              <Input
                type="text"
                value={addressedTo}
                onChange={(e) => setAddressedTo(e.target.value)}
                placeholder="To Whom It May Concern / Bank XYZ / Embassy"
              />
            </div>
            <div>
              <Label>Purpose</Label>
              <Input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Visa application, bank loan, …"
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the letter body here."
                rows={6}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

function TypeCard({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className={`text-sm font-medium ${active ? "text-brand-700" : "text-slate-900"}`}>
        {title}
      </div>
      <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
    </button>
  );
}
