"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import {
  getParticipantsForCommittee,
  calculateParticipantAverage,
} from "@/lib/utils";

export default function QualifiersPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { scores } = useScores();
  const {
    committees,
    participants,
    categories,
    phases,
    setParticipantQualified,
    advanceQualifiedParticipants,
  } = useAppData();
  const [feedback, setFeedback] = useState<{ type: "success" | "info"; text: string } | null>(null);

  if (!currentUser || !activeCommitteeId) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  const committeeId = activeCommitteeId;
  const committee = committees.find((c) => c.id === committeeId);
  const currentPhase = committee ? phases.find((ph) => ph.id === committee.phaseId) : undefined;
  const nextPhase = currentPhase
    ? phases.find((ph) => ph.order === currentPhase.order + 1)
    : undefined;

  const myParticipants = getParticipantsForCommittee(committeeId, committees, participants);
  const readyToAdvanceCount = myParticipants.filter((p) => p.qualified && !p.advanced).length;

  function handleToggle(participantId: string, current: boolean) {
    setParticipantQualified(participantId, !current);
    setFeedback(null);
  }

  function handleAdvance() {
    const count = advanceQualifiedParticipants(committeeId);
    if (count > 0) {
      setFeedback({
        type: "success",
        text: `تم ترحيل ${count} مشارك بنجاح إلى مرحلة "${nextPhase?.name}".`,
      });
    } else {
      setFeedback({
        type: "info",
        text: "لا يوجد مشاركون جاهزون للترحيل الآن — حدّد المتأهلين أولًا.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">تحديد المتأهلين</h1>
          <p className="text-neutral-400 mt-1">{committee?.name}</p>
        </div>

        {nextPhase ? (
          <button
            onClick={handleAdvance}
            disabled={readyToAdvanceCount === 0}
            className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ترحيل المتأهلين إلى {nextPhase.name} ({readyToAdvanceCount})
          </button>
        ) : (
          <span className="rounded-lg border border-neutral-700 px-4 py-2 text-xs text-neutral-500">
            هذه هي المرحلة الأخيرة — لا توجد مرحلة تالية
          </span>
        )}
      </div>

      {feedback && (
        <p
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/20 bg-amber-500/10 text-amber-300"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {categories.map((cat) => {
        const categoryParticipants = myParticipants
          .filter((p) => p.categoryId === cat.id)
          .map((p) => ({
            participant: p,
            ...calculateParticipantAverage(p.id, committeeId, scores),
          }))
          .sort((a, b) => b.average - a.average);

        if (categoryParticipants.length === 0) return null;

        return (
          <div key={cat.id} className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
            <h2 className="text-amber-400 font-semibold mb-4">فئة {cat.name}</h2>

            <div className="flex flex-col gap-2">
              {categoryParticipants.map(({ participant, average }, index) => {
                const isQualified = participant.qualified;
                const isAdvanced = participant.advanced;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-800 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500 w-6">{index + 1}</span>
                      <span className="text-sm text-neutral-100">{participant.fullName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-amber-300 text-sm font-semibold">
                        {average.toFixed(2)}
                      </span>
                      {isAdvanced ? (
                        <span className="text-xs rounded-md border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-sky-300">
                          تم الترحيل ↗
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggle(participant.id, isQualified)}
                          className={`text-xs rounded-md px-3 py-1.5 border transition ${
                            isQualified
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                              : "border-neutral-700 text-neutral-400 hover:border-amber-500/30 hover:text-amber-300"
                          }`}
                        >
                          {isQualified ? "متأهل ✓" : "تحديد كمتأهل"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-neutral-500 text-center">
        ملاحظة: لا يتم كسر التعادل — المشاركون بنفس المعدل يحتفظون بنفس الترتيب.
      </p>
    </div>
  );
}