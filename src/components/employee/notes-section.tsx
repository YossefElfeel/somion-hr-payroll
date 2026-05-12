"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import type { Note } from "@/lib/domain/types";
import { addNote, removeNote, updateNote } from "@/lib/actions";
import { EmployeeSection } from "./section";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface Props {
  employeeId: string;
  notes: Note[];
}

export function NotesSection({ employeeId, notes }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <EmployeeSection
      title="Notes"
      action={
        <button
          onClick={() => setAdding(true)}
          disabled={pending || adding}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Plus size={12} /> Write a note
        </button>
      }
    >
      {adding && (
        <NoteForm
          onCancel={() => setAdding(false)}
          onSubmit={(title, body) =>
            startTransition(async () => {
              await addNote({ employeeId, title, body });
              setAdding(false);
            })
          }
          pending={pending}
        />
      )}

      {notes.length === 0 && !adding ? (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No notes yet. Write one to track context HR should remember.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              {editingId === n.id ? (
                <NoteForm
                  initial={{ title: n.title, body: n.body }}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(title, body) =>
                    startTransition(async () => {
                      await updateNote(n.id, { title, body });
                      setEditingId(null);
                    })
                  }
                  pending={pending}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">{n.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatDate(n.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(n.id)}
                        disabled={pending}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-700 disabled:opacity-50"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            await removeNote(n.id, employeeId);
                          })
                        }
                        disabled={pending}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {n.body}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </EmployeeSection>
  );
}

function NoteForm({
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  initial?: { title: string; body: string };
  onSubmit: (title: string, body: string) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const canSave = title.trim().length > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
        rows={4}
        className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          <X size={12} /> Cancel
        </button>
        <button
          onClick={() => onSubmit(title.trim(), body)}
          disabled={pending || !canSave}
          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Check size={12} /> Save
        </button>
      </div>
    </div>
  );
}
