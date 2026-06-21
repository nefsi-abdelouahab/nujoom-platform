"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { apiRequest, normalizeId } from "@/lib/api";
import { Participant } from "@/types";

interface RankedParticipant {
  participant: Participant;
  average: number;
  rank: number;
}

interface CategoryResult {
  category: { id: string; name: string };
  participants: RankedParticipant[];
}

export default function QualifiersPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { committees, phases } = useAppData();
  const [resultsByCategory, setResultsByCategory] = useState<CategoryResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (!activeCommitteeId) return;
    async function load() {
      try {
        const data = await apiRequest<{ committee: any; resultsByCategory: CategoryResult[] }>(
          "/head/results"
        );
        setResultsByCategory(data.resultsByCategory || []);
      } catch {
        // تحميل فاشل
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [activeCommitteeId]);

  if (!currentUser || !activeCommitteeId) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  const committee = committees.find((c) => c.id === activeCommitteeId);
  const currentPhase = committee ? phases.find((ph) => ph.id === committee.phaseId) : undefined;
  const nextPhase = currentPhase ? phases.find((ph) => ph.order === currentPhase.order + 1) : undefined;

  const allParticipants = resultsByCategory.flatMap((cat) => cat.participants.map((r) => r.participant));
  const readyToAdvanceCount = allParticipants.filter((p) => p.qualified && !p.advanced).length;

  async function handleToggle(participantId: string, current: boolean) {
    const updated = await apiRequest<Record<string, unknown>>(
      `/head/participants/${participantId}/qualify`,
      { method: "PATCH", body: { qualified: !current } }
    );
    const norm = normalizeId(updated) as unknown as Participant;
    setResultsByCategory((prev) =>
      prev.map((cat) => ({
        ...cat,
        participants: cat.participants.map((r) =>
          r.participant.id === participantId ? { ...r, participant: norm } : r
        ),
      }))
    );
    setFeedback(null);
  }

  async function handleAdvance() {
    const result = await apiRequest<{ advancedCount: number; message?: string }>(
      "/head/advance-qualified",
      { method: "POST" }
    );
    if (result.advancedCount > 0) {
      setFeedback({
        type: "success",
        text: `تم ترحيل ${result.advancedCount} مشارك بنجاح إلى مرحلة "${nextPhase?.name}".`,
      });
      // نُعيد جلب النتائج لأن advanced تغيّرت
      const data = await apiRequest<{ committee: any; resultsByCategory: CategoryResult[] }>("/head/results");
      setResultsByCategory(data.resultsByCategory || []);
    } else {
      setFeedback({ type: "info", text: "لا يوجد مشاركون جاهزون للترحيل الآن." });
    }
  }

  if (isLoading) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
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
        <p className={`rounded-lg border px-4 py-2.5 text-sm ${
          feedback.type === "success"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            : "border-amber-500/20 bg-amber-500/10 text-amber-300"
        }`}>
          {feedback.text}
        </p>
      )}

      {resultsByCategory.map(({ category, participants: ranked }) => {
        if (ranked.length === 0) return null;
        return (
          <div key={category.id} className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
            <h2 className="text-amber-400 font-semibold mb-4">فئة {category.name}</h2>
            <div className="flex flex-col gap-2">
              {ranked.map(({ participant, average, rank }) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-800 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 w-6">{rank}</span>
                    <span className="text-sm text-neutral-100">{participant.fullName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-amber-300 text-sm font-semibold">{average.toFixed(2)}</span>
                    {participant.advanced ? (
                      <span className="text-xs rounded-md border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-sky-300">
                        تم الترحيل ↗
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggle(participant.id, participant.qualified)}
                        className={`text-xs rounded-md px-3 py-1.5 border transition ${
                          participant.qualified
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                            : "border-neutral-700 text-neutral-400 hover:border-amber-500/30 hover:text-amber-300"
                        }`}
                      >
                        {participant.qualified ? "متأهل ✓" : "تحديد كمتأهل"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
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