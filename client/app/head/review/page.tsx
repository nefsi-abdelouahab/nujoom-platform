"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { apiRequest, normalizeIds, normalizeId } from "@/lib/api";
import { getCriteriaCountForCommittee, getAssignmentsForCommittee } from "@/lib/utils";
import { Participant, Score, CommitteeCriterionAssignment } from "@/types";

export default function ReviewPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { committees, assignments, criteria, users, categories } = useAppData();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingApproveAll, setConfirmingApproveAll] = useState(false);

  useEffect(() => {
    if (!activeCommitteeId) return;
    async function load() {
      try {
        const data = await apiRequest<{
          participants: Record<string, unknown>[];
          assignments: Record<string, unknown>[];
          scores: Record<string, unknown>[];
        }>("/head/review");
        setParticipants(normalizeIds(data.participants) as unknown as Participant[]);
        setScores(normalizeIds(data.scores) as unknown as Score[]);
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
  const committeeAssignments = getAssignmentsForCommittee(activeCommitteeId, assignments, criteria, users);
  const criteriaCount = getCriteriaCountForCommittee(activeCommitteeId, assignments);

  const pendingScores = scores.filter((s) => !s.approved);
  const totalExpected = participants.length * criteriaCount;

  async function handleApproveScore(scoreId: string) {
    await apiRequest(`/head/scores/${scoreId}/approve`, { method: "POST" });
    setScores((prev) => prev.map((s) => (s.id === scoreId ? { ...s, approved: true } : s)));
  }

  async function handleApproveAll() {
    if (pendingScores.length === 0) return;
    const scoreIds = pendingScores.map((s) => s.id);
    await apiRequest("/head/scores/approve-many", {
      method: "POST",
      body: { scoreIds },
    });
    const idSet = new Set(scoreIds);
    setScores((prev) => prev.map((s) => (idSet.has(s.id) ? { ...s, approved: true } : s)));
    setConfirmingApproveAll(false);
  }

  if (isLoading) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">مراجعة واعتماد الدرجات</h1>
          <p className="text-neutral-400 mt-1">{committee?.name}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {!confirmingApproveAll ? (
            <button
              onClick={() => setConfirmingApproveAll(true)}
              disabled={pendingScores.length === 0}
              className="rounded-lg bg-gradient-to-l from-amber-500 to-amber-400 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              اعتماد الكل ({pendingScores.length} درجة بانتظار الاعتماد)
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
              <span className="text-sm text-amber-200">
                تأكيد اعتماد {pendingScores.length} درجة؟
              </span>
              <button
                onClick={handleApproveAll}
                className="rounded-md bg-amber-400 px-3 py-1.5 text-xs font-bold text-neutral-900 hover:bg-amber-300"
              >
                تأكيد
              </button>
              <button
                onClick={() => setConfirmingApproveAll(false)}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="عدد المشاركين" value={participants.length.toString()} />
        <StatCard label="عدد المعايير" value={criteriaCount.toString()} />
        <StatCard label="درجات مُدخلة" value={`${scores.length} / ${totalExpected}`} />
        <StatCard label="بانتظار الاعتماد" value={pendingScores.length.toString()} highlight={pendingScores.length > 0} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-amber-500/15 bg-neutral-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-500/15 text-right">
              <th className="px-4 py-3 text-neutral-400 font-medium sticky right-0 bg-neutral-900">المشارك</th>
              <th className="px-4 py-3 text-neutral-400 font-medium">الفئة</th>
              {committeeAssignments.map((a) => (
                <th key={a.id} className="px-4 py-3 text-neutral-400 font-medium whitespace-nowrap">
                  {a.criterion?.name}
                  <div className="text-xs text-neutral-600 font-normal">{a.judge?.fullName}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => {
              const categoryName = categories.find((c) => c.id === p.categoryId)?.name;
              return (
                <tr key={p.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/20">
                  <td className="px-4 py-3 text-neutral-100 font-medium sticky right-0 bg-neutral-900/95">{p.fullName}</td>
                  <td className="px-4 py-3 text-neutral-500">{categoryName}</td>
                  {committeeAssignments.map((a) => {
                    const score = scores.find(
                      (s) =>
                        s.participantId === p.id &&
                        s.committeeId === activeCommitteeId &&
                        s.criterionId === a.criterionId &&
                        s.judgeUserId === a.judgeUserId
                    );
                    return (
                      <td key={a.id} className={`px-4 py-3 ${score && !score.approved ? "bg-amber-500/[0.04]" : ""}`}>
                        {score ? (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-300 font-semibold">{score.total.toFixed(1)}</span>
                            {score.approved ? (
                              <span className="text-xs text-emerald-400 whitespace-nowrap">معتمدة ✓</span>
                            ) : (
                              <button
                                onClick={() => handleApproveScore(score.id)}
                                className="text-xs rounded-md border border-amber-500/30 px-2 py-1 text-amber-300 transition hover:bg-amber-500/10 whitespace-nowrap"
                              >
                                اعتماد
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-600">لم تُدخل</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {participants.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-8">لا يوجد مشاركون في لجنتك حاليًا</p>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-amber-400/40 bg-amber-500/5" : "border-neutral-800 bg-neutral-900/50"}`}>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? "text-amber-300" : "text-neutral-100"}`}>{value}</p>
    </div>
  );
}