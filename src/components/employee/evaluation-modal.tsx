"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { submitEvaluation } from "@/lib/actions";
import {
  EVALUATION_CATEGORIES,
  type EvaluationCategory,
  type EvaluationScore,
} from "@/lib/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

type Scores = Partial<Record<EvaluationCategory, EvaluationScore>>;

export function EvaluationModal({ open, onClose, employeeId, employeeName }: Props) {
  const [periodLabel, setPeriodLabel] = useState("");
  const [scores, setScores] = useState<Scores>({});
  const [strengths, setStrengths] = useState("");
  const [areasToImprove, setAreasToImprove] = useState("");
  const [goalsNextPeriod, setGoalsNextPeriod] = useState("");
  const [comments, setComments] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allScored = EVALUATION_CATEGORIES.every((c) => scores[c] !== undefined);
  const overall = allScored
    ? Object.values(scores).reduce((a, b) => a + (b ?? 0), 0) /
      EVALUATION_CATEGORIES.length
    : 0;
  const canSubmit =
    allScored &&
    periodLabel.trim().length > 0 &&
    strengths.trim().length > 0 &&
    areasToImprove.trim().length > 0;

  function reset() {
    setPeriodLabel("");
    setScores({});
    setStrengths("");
    setAreasToImprove("");
    setGoalsNextPeriod("");
    setComments("");
    setError(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`New Evaluation — ${employeeName}`}
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
                  await submitEvaluation({
                    employeeId,
                    periodLabel: periodLabel.trim(),
                    scores: scores as Record<EvaluationCategory, EvaluationScore>,
                    strengths: strengths.trim(),
                    areasToImprove: areasToImprove.trim(),
                    goalsNextPeriod: goalsNextPeriod.trim() || undefined,
                    comments: comments.trim() || undefined,
                  });
                  reset();
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              });
            }}
          >
            Submit evaluation & send
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Period</Label>
          <Input
            type="text"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            placeholder="e.g. Q2 2026, H1 2026, Annual 2025"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Scorecard</Label>
            <div className="text-xs text-slate-500">
              {allScored ? (
                <>
                  Overall:{" "}
                  <span className="font-semibold text-brand-700">
                    {overall.toFixed(1)} / 5
                  </span>
                </>
              ) : (
                "Pick a score for each category"
              )}
            </div>
          </div>
          <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
            {EVALUATION_CATEGORIES.map((cat) => (
              <li key={cat} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-slate-700">{cat}</span>
                <Stars
                  value={scores[cat]}
                  onChange={(v) => setScores((s) => ({ ...s, [cat]: v }))}
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Label>Strengths</Label>
          <Textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="What did they do well?"
            rows={3}
          />
        </div>

        <div>
          <Label>Areas to improve</Label>
          <Textarea
            value={areasToImprove}
            onChange={(e) => setAreasToImprove(e.target.value)}
            placeholder="Where should they focus next?"
            rows={3}
          />
        </div>

        <div>
          <Label>Goals for next period (optional)</Label>
          <Textarea
            value={goalsNextPeriod}
            onChange={(e) => setGoalsNextPeriod(e.target.value)}
            placeholder="What should they aim for in the next cycle?"
            rows={3}
          />
        </div>

        <div>
          <Label>Additional comments (optional)</Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Anything else worth noting"
            rows={2}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

function Stars({
  value,
  onChange,
}: {
  value?: EvaluationScore;
  onChange: (v: EvaluationScore) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value !== undefined && n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n as EvaluationScore)}
            className="rounded p-0.5 hover:bg-slate-100"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              size={18}
              className={
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
