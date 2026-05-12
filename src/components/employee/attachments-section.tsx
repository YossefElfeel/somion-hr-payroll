"use client";

import { useState, useTransition } from "react";
import { FileText, Plus, X } from "lucide-react";
import type { Attachment, AttachmentKind } from "@/lib/domain/types";
import { addAttachment, removeAttachment } from "@/lib/actions";
import { useCurrentRole } from "@/components/shell/role-switcher";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EmployeeSection } from "./section";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

interface Props {
  employeeId: string;
  attachments: Attachment[];
}

export function AttachmentsSection({ employeeId, attachments }: Props) {
  const role = useCurrentRole();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const canEdit = role === "HR" || role === "ADMIN";

  return (
    <>
      <EmployeeSection
        title="Attachments"
        hint="Documents on file for this employee. (Demo: metadata-only — file bytes are not stored.)"
        action={
          canEdit ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus size={12} /> Add attachment
            </button>
          ) : null
        }
      >
        {attachments.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No attachments on file.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-600">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-slate-900">
                    {a.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatSize(a.sizeBytes)}
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await removeAttachment(a.id, employeeId);
                      })
                    }
                    disabled={pending}
                    title="Remove"
                    className="absolute right-1 top-1 rounded-full bg-white p-1 text-slate-400 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100 disabled:opacity-30"
                  >
                    <X size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </EmployeeSection>

      <AddAttachmentModal
        open={open}
        onClose={() => setOpen(false)}
        employeeId={employeeId}
      />
    </>
  );
}

function AddAttachmentModal({
  open,
  onClose,
  employeeId,
}: {
  open: boolean;
  onClose: () => void;
  employeeId: string;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AttachmentKind>("OTHER");
  const [sizeStr, setSizeStr] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setKind("OTHER");
    setSizeStr("");
    setError(null);
  }

  // Lets HR optionally pick a file via the OS picker — we just record its
  // name + size as metadata. The bytes themselves are not stored (per demo
  // posture). HR can also type a name/size directly without picking a file.
  function pickFile() {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.onchange = () => {
      const f = inp.files?.[0];
      if (!f) return;
      setName(f.name);
      setSizeStr(String(f.size));
      const lower = f.name.toLowerCase();
      if (lower.includes("contract")) setKind("CONTRACT");
      else if (lower.includes("military")) setKind("MILITARY");
      else if (lower.includes("id") || lower.includes("identity")) setKind("IDENTITY");
      else if (lower.includes("educ") || lower.includes("diploma")) setKind("EDUCATION");
    };
    inp.click();
  }

  const sizeBytes = Number(sizeStr);
  const canSubmit =
    name.trim().length > 0 && Number.isFinite(sizeBytes) && sizeBytes >= 0;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add Attachment"
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
                  await addAttachment({
                    employeeId,
                    name: name.trim(),
                    kind,
                    sizeBytes,
                  });
                  reset();
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
      <div className="space-y-3">
        <div>
          <Label>File</Label>
          <button
            onClick={pickFile}
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 hover:bg-slate-100"
          >
            {name ? (
              <span className="truncate text-slate-800">{name}</span>
            ) : (
              <>📎 Pick a file</>
            )}
          </button>
        </div>
        <div>
          <Label>Filename</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="contract.pdf"
          />
        </div>
        <div>
          <Label>Kind</Label>
          <Select value={kind} onChange={(e) => setKind(e.target.value as AttachmentKind)}>
            <option value="CONTRACT">Contract</option>
            <option value="MILITARY">Military service</option>
            <option value="IDENTITY">Identity / National ID</option>
            <option value="EDUCATION">Education</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div>
          <Label>Size (bytes)</Label>
          <Input
            type="number"
            min="0"
            value={sizeStr}
            onChange={(e) => setSizeStr(e.target.value)}
            placeholder="e.g. 12000000 for 12 MB"
          />
        </div>
        <p className="text-xs text-slate-500">
          Demo mode: only metadata is stored. The actual file bytes are not
          uploaded anywhere.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
