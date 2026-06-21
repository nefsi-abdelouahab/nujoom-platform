"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { apiRequest, normalizeIds, normalizeId } from "@/lib/api";
import { getCriterionById } from "@/lib/utils";
import { Participant, Score } from "@/types";
import ScoringForm from "@/components/shared/ScoringForm";

export default function HeadScoringPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { committees, criteria, categories } = useAppData();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myScores, setMyScores] = useState<Score[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeCommitteeId) return;
    async function load() {
      try {
        const data = await apiRequest<{
          participants: Record<string, unknown>[];
          myScores: Record<string, unknown>[];
        }>("/head/participants");
        setParticipants(normalizeIds(data.participants) as unknown as Participant[]);
        setMyScores(normalizeIds(data.myScores) as unknown as Score[]);
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
  const criterion = getCriterionById(currentUser.criterionId || "", criteria);

  if (!criterion) {
    return <p className="text-neutral-400">لا يوجد معيار مخصص لك حاليًا.</p>;
  }

  const filteredParticipants = participants.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.municipality?.toLowerCase().includes(term)
    );
  });

  function getExistingScore(participantId: string) {
    return myScores.find(
      (s) =>
        s.participantId === participantId &&
        s.criterionId === criterion!.id &&
        s.judgeUserId === currentUser!.id
    );
  }

  async function handleSave(input: Omit<Score, "id">) {
    const saved = await apiRequest<Record<string, unknown>>("/head/scores", {
      method: "POST",
      body: {
        participantId: input.participantId,
        indicatorScores: input.indicatorScores,
      },
    });
    const normalized = normalizeId(saved) as unknown as Score;
    setMyScores((prev) => {
      const idx = prev.findIndex(
        (s) =>
          s.participantId === normalized.participantId &&
          s.criterionId === normalized.criterionId &&
          s.judgeUserId === normalized.judgeUserId
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = normalized;
        return updated;
      }
      return [...prev, normalized];
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">تقييم معياري</h1>
        <p className="text-neutral-400 mt-1">
          {committee?.name} — معيار: {criterion.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو رقم التسجيل..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />

          <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-4 flex flex-col gap-2 max-h-[65vh] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-neutral-500 text-center py-6">جاري التحميل...</p>
            ) : (
              filteredParticipants.map((p) => {
                const existing = getExistingScore(p.id);
                const categoryName = categories.find((c) => c.id === p.categoryId)?.name;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedParticipant(p)}
                    className={`w-full text-right rounded-xl border px-4 py-3 transition ${
                      selectedParticipant?.id === p.id
                        ? "border-amber-400 bg-amber-500/10"
                        : "border-neutral-800 hover:border-amber-500/30 hover:bg-neutral-800/50"
                    }`}
                  >
                    <p className="text-sm font-medium text-neutral-100">{p.fullName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-neutral-500">{categoryName}</span>
                      {existing ? (
                        <span className={`text-xs ${existing.approved ? "text-emerald-400" : "text-sky-400"}`}>
                          {existing.approved ? "معتمدة ✓" : "محفوظة"}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500">بانتظار التقييم</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
            {!isLoading && filteredParticipants.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-6">لا توجد نتائج مطابقة</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
          {selectedParticipant ? (
            <ScoringForm
              key={`${selectedParticipant.id}-${criterion.id}-${currentUser.id}`}
              participant={selectedParticipant}
              criterionId={criterion.id}
              indicators={criterion.indicators}
              committeeId={activeCommitteeId}
              judgeUserId={currentUser.id}
              existingScore={getExistingScore(selectedParticipant.id)}
              onSave={handleSave}
            />
          ) : (
            <p className="text-neutral-500 text-center py-12">
              اختر مشاركًا من القائمة لبدء التقييم
            </p>
          )}
        </div>
      </div>
    </div>
  );
}