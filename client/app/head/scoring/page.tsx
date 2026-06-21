"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import { getParticipantsForCommittee, getCriterionById, getScoreFor } from "@/lib/utils";
import { Participant } from "@/types";
import ScoringForm from "@/components/shared/ScoringForm";

export default function HeadScoringPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { scores, saveScore } = useScores();
  const { committees, criteria, participants, categories } = useAppData();
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  if (!currentUser || !activeCommitteeId) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  const committee = committees.find((c) => c.id === activeCommitteeId);
  const criterion = getCriterionById(currentUser.criterionId || "", criteria);
  const myParticipants = getParticipantsForCommittee(activeCommitteeId, committees, participants);

  if (!criterion) {
    return <p className="text-neutral-400">لا يوجد معيار مخصص لك حاليًا.</p>;
  }

  const filteredParticipants = myParticipants.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      p.municipality?.toLowerCase().includes(term)
    );
  });

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
          {/* شريط البحث عن مشارك بالاسم أو المعرّف */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو رقم التسجيل..."
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2.5 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
          />

          <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-4 flex flex-col gap-2 max-h-[65vh] overflow-y-auto">
            {filteredParticipants.map((p) => {
              const existing = getScoreFor(
                p.id,
                activeCommitteeId,
                criterion.id,
                currentUser.id,
                scores
              );
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
                      <span
                        className={`text-xs ${
                          existing.approved ? "text-emerald-400" : "text-sky-400"
                        }`}
                      >
                        {existing.approved ? "معتمدة ✓" : "محفوظة"}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-500">بانتظار التقييم</span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredParticipants.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-6">
                لا توجد نتائج مطابقة للبحث
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
          {selectedParticipant ? (
            <ScoringForm
              // مهم جدًا: key يضمن إعادة تهيئة النموذج بالكامل عند تغيير المشارك،
              // بدل بقاء قيم المشارك السابق ظاهرة في الحقول
              key={`${selectedParticipant.id}-${criterion.id}-${currentUser.id}`}
              participant={selectedParticipant}
              criterionId={criterion.id}
              indicators={criterion.indicators}
              committeeId={activeCommitteeId}
              judgeUserId={currentUser.id}
              existingScore={getScoreFor(
                selectedParticipant.id,
                activeCommitteeId,
                criterion.id,
                currentUser.id,
                scores
              )}
              onSave={saveScore}
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