"use client";

import { useState } from "react";
import { calculateTotal, getScoreFor } from "@/lib/utils";
import { Participant, Indicator } from "@/types";

export default function ScoringForm({
  participant,
  criterionId,
  indicators,
  committeeId,
  judgeUserId,
  existingScore,
  onSave,
}: {
  participant: Participant;
  criterionId: string;
  indicators: Indicator[];
  committeeId: string;
  judgeUserId: string;
  existingScore?: ReturnType<typeof getScoreFor>;
  onSave: (score: {
    participantId: string;
    committeeId: string;
    criterionId: string;
    judgeUserId: string;
    indicatorScores: { indicatorId: string; value: number }[];
    total: number;
    approved: boolean;
  }) => void;
}) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    indicators.forEach((ind) => {
      const found = existingScore?.indicatorScores.find(
        (is) => is.indicatorId === ind.id
      );
      initial[ind.id] = found?.value ?? 0;
    });
    return initial;
  });

  const total = calculateTotal(Object.values(values));
  const maxTotal = calculateTotal(indicators.map((i) => i.maxScore));
  const isApproved = existingScore?.approved ?? false;

  function handleChange(indicatorId: string, raw: string, max: number) {
    let v = parseFloat(raw);
    if (isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > max) v = max;
    setValues((prev) => ({ ...prev, [indicatorId]: v }));
  }

  function handleSubmit() {
    onSave({
      participantId: participant.id,
      committeeId,
      criterionId,
      judgeUserId,
      indicatorScores: indicators.map((ind) => ({
        indicatorId: ind.id,
        value: values[ind.id] ?? 0,
      })),
      total,
      approved: false,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-neutral-100">{participant.fullName}</h2>
        <p className="text-sm text-neutral-500">{participant.municipality}</p>
      </div>

      <div className="flex flex-col gap-3">
        {indicators.map((ind) => (
          <div key={ind.id} className="flex items-center justify-between gap-4">
            <label className="text-sm text-neutral-300 flex-1">{ind.name}</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={ind.maxScore}
              value={values[ind.id]}
              disabled={isApproved}
              onChange={(e) => handleChange(ind.id, e.target.value, ind.maxScore)}
              className="w-24 rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-center text-neutral-100 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 disabled:opacity-50"
            />
            <span className="text-xs text-neutral-500 w-12">/ {ind.maxScore}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
        <span className="text-sm text-neutral-400">المجموع</span>
        <span className="text-lg font-bold text-amber-300">
          {total.toFixed(1)} / {maxTotal}
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isApproved}
        className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-4 py-2.5 font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300 hover:shadow-[0_0_25px_-5px_rgba(212,175,55,0.7)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isApproved ? "تم الاعتماد — لا يمكن التعديل" : "حفظ الدرجة"}
      </button>
    </div>
  );
}