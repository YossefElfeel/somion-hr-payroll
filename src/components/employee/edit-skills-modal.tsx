"use client";

import { useState, useTransition } from "react";
import { X, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateEmployeeProfile } from "@/lib/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  initialSkills: string[];
}

export function EditSkillsModal({ open, onClose, employeeId, initialSkills }: Props) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addDraft() {
    const v = draft.trim();
    if (!v) return;
    if (skills.includes(v)) {
      setDraft("");
      return;
    }
    setSkills((s) => [...s, v]);
    setDraft("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Skills"
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
                  await updateEmployeeProfile(employeeId, { skills });
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label>Add a skill</Label>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDraft();
                }
              }}
              placeholder="e.g. UI Design"
            />
            <button
              type="button"
              onClick={addDraft}
              disabled={!draft.trim()}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        <div>
          <Label>Current skills</Label>
          {skills.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
              No skills yet. Add one above.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills((arr) => arr.filter((x) => x !== s))}
                    className="rounded-full text-slate-400 hover:text-red-600"
                    title="Remove"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
