"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { issueExperienceCertificate } from "@/lib/actions";
import { ReasonPicker } from "./reason-picker";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  // Smart defaults so HR doesn't retype data we already have on the employee.
  employeeJobTitle?: string;
  employeeJoinDate?: string;
  employeeStatus?: string; // "Active" | "Inactive" | "On leave"
}

// Today as yyyy-mm-dd, for the max attribute on date inputs.
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function IssueExperienceCertificateModal({
  open,
  onClose,
  employeeId,
  employeeName,
  employeeJobTitle,
  employeeJoinDate,
  employeeStatus,
}: Props) {
  const defaultStillEmployed = employeeStatus !== "Inactive";

  const [position, setPosition] = useState(employeeJobTitle ?? "");
  const [startDate, setStartDate] = useState(employeeJoinDate ?? "");
  const [stillEmployed, setStillEmployed] = useState(defaultStillEmployed);
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("General reference");
  const [remarks, setRemarks] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Re-sync defaults when the modal re-opens for a different employee (the
  // section component reuses one modal instance per page).
  useEffect(() => {
    if (!open) return;
    setPosition(employeeJobTitle ?? "");
    setStartDate(employeeJoinDate ?? "");
    setStillEmployed(employeeStatus !== "Inactive");
    setEndDate("");
    setReason("General reference");
    setRemarks("");
    setError(null);
  }, [open, employeeJobTitle, employeeJoinDate, employeeStatus]);

  const today = todayDate();

  // Validation — mirrors what the server checks so the submit button reflects
  // actual eligibility.
  const validationError = (() => {
    if (position.trim().length === 0) return "Position is required.";
    if (!startDate) return "Start date is required.";
    if (startDate > today) return "Start date can't be in the future.";
    if (!stillEmployed) {
      if (!endDate) return "End date is required when the employee has left.";
      if (endDate < startDate) return "End date can't be before start date.";
      if (endDate > today) return "End date can't be in the future.";
    }
    if (reason.trim().length === 0) return "Pick or describe a reason for issuance.";
    return null;
  })();

  // Build the body preview so HR can see what the PDF will say before
  // sending. Plain text version of the PDF's first two paragraphs.
  const previewBody = (() => {
    const verb = stillEmployed ? "is" : "was";
    const datePhrase = stillEmployed
      ? `since ${formatDateForPreview(startDate)}`
      : endDate
        ? `from ${formatDateForPreview(startDate)} to ${formatDateForPreview(endDate)}`
        : `from ${formatDateForPreview(startDate)}`;
    const firstName = employeeName.split(" ")[0];
    const pos = position.trim() || "—";
    return [
      `This is to certify that ${employeeName} ${verb} employed at Somion as a ${pos}, ${datePhrase}.`,
      `During this period, ${firstName} demonstrated a strong work ethic and contributed meaningfully to the team.`,
      remarks.trim() ? `Remarks: ${remarks.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Issue Experience Certificate — ${employeeName}`}
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
                  await issueExperienceCertificate({
                    employeeId,
                    position: position.trim(),
                    startDate,
                    stillEmployed,
                    endDate: stillEmployed ? undefined : endDate,
                    reason: reason.trim(),
                    remarks: remarks.trim() || undefined,
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
          <Label>Position</Label>
          <Input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Product Designer"
          />
          {employeeJobTitle && position !== employeeJobTitle && (
            <p className="mt-1 text-xs text-slate-500">
              Prefilled from the employee record — edit if the cert should
              reflect a different title.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start date</Label>
            <Input
              type="date"
              max={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Employment</Label>
            <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStillEmployed(true)}
                className={`flex-1 rounded px-2 py-1 ${
                  stillEmployed
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Still employed
              </button>
              <button
                type="button"
                onClick={() => setStillEmployed(false)}
                className={`flex-1 rounded px-2 py-1 ${
                  !stillEmployed
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Ended on…
              </button>
            </div>
          </div>
        </div>

        {!stillEmployed && (
          <div>
            <Label>End date</Label>
            <Input
              type="date"
              min={startDate || undefined}
              max={today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}

        <ReasonPicker
          value={reason}
          onChange={setReason}
          otherPlaceholder="e.g. Required by visa office in São Paulo"
        />

        <div>
          <Label>Remarks (optional)</Label>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Specific achievements, projects, or context HR wants on the cert."
            rows={3}
          />
        </div>

        {/* Live preview so HR can sanity-check before sending. Approximates
            the first two paragraphs of the PDF body. */}
        <div>
          <Label>Preview</Label>
          <div className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
            {previewBody}
          </div>
        </div>

        {validationError && (
          <p className="text-xs text-amber-700">{validationError}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

// Tiny inline date formatter just for the preview — keeps this component
// dependency-free of the PDF styles helper.
function formatDateForPreview(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
