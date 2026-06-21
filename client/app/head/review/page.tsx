"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import {
  getParticipantsForCommittee,
  getAssignmentsForCommittee,
  getCriteriaCountForCommittee,
} from "@/lib/utils";

export default function ReviewPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { scores, approveScore, approveMany } = useScores();
  const { committees, participants, categories, assignments, criteria, users } = useAppData();
  const [confirmingApproveAll, setConfirmingApproveAll] = useState(false);

  if (!currentUser || !activeCommitteeId) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  const committee = committees.find((c) => c.id === activeCommitteeId);
  const myParticipants = getParticipantsForCommittee(activeCommitteeId, committees, participants);
  const committeeAssignments = getAssignmentsForCommittee(activeCommitteeId, assignments, criteria, users);
  const criteriaCount = getCriteriaCountForCommittee(activeCommitteeId, assignments);

  // كل الدرجات المُدخلة في هذه اللجنة (لحساب الإحصائيات وزر "اعتماد الكل")
  const committeeScores = scores.filter((s) => s.committeeId === activeCommitteeId);
  const pendingScores = committeeScores.filter((s) => !s.approved);
  // مهم: نستخدم عدد المعايير الفريدة (criteriaCount) وليس عدد التعيينات
  // (committeeAssignments.length) لأن معيارًا واحدًا قد يكون له أكثر من محكّم،
  // وكل مشارك يُقيَّم في كل معيار مرة واحدة فقط فعليًا
  const totalExpected = myParticipants.length * criteriaCount;

  function handleApproveAll() {
    if (pendingScores.length === 0) return;
    approveMany(pendingScores.map((s) => s.id));
    setConfirmingApproveAll(false);
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
                تأكيد اعتماد {pendingScores.length} درجة لكل المشاركين والمعايير دفعة واحدة؟
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

      {/* إحصائيات سريعة لتسهيل المراجعة الجماعية */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="عدد المشاركين" value={myParticipants.length.toString()} />
        <StatCard label="عدد المعايير" value={criteriaCount.toString()} />
        <StatCard label="درجات مُدخلة" value={`${committeeScores.length} / ${totalExpected}`} />
        <StatCard
          label="بانتظار الاعتماد"
          value={pendingScores.length.toString()}
          highlight={pendingScores.length > 0}
        />
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
                  <div className="text-xs text-neutral-600 font-normal">
                    {a.judge?.fullName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myParticipants.map((p) => {
              const categoryName = categories.find((c) => c.id === p.categoryId)?.name;

              return (
                <tr key={p.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/20">
                  <td className="px-4 py-3 text-neutral-100 font-medium sticky right-0 bg-neutral-900/95">
                    {p.fullName}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{categoryName}</td>
                  {committeeAssignments.map((a) => {
                    // مهم: المطابقة تشمل judgeUserId أيضًا، لأن نفس المعيار قد يكون
                    // له عدة محكّمين في اللجنة (كل عمود يخصّ محكّمًا واحدًا بالضبط)
                    const score = scores.find(
                      (s) =>
                        s.participantId === p.id &&
                        s.committeeId === activeCommitteeId &&
                        s.criterionId === a.criterionId &&
                        s.judgeUserId === a.judgeUserId
                    );

                    return (
                      <td
                        key={a.id}
                        className={`px-4 py-3 ${
                          score && !score.approved ? "bg-amber-500/[0.04]" : ""
                        }`}
                      >
                        {score ? (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-300 font-semibold">
                              {score.total.toFixed(1)}
                            </span>
                            {score.approved ? (
                              <span className="text-xs text-emerald-400 whitespace-nowrap">
                                معتمدة ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => approveScore(score.id)}
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

      {myParticipants.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-8">لا يوجد مشاركون في لجنتك حاليًا</p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight ? "border-amber-400/40 bg-amber-500/5" : "border-neutral-800 bg-neutral-900/50"
      }`}
    >
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? "text-amber-300" : "text-neutral-100"}`}>
        {value}
      </p>
    </div>
  );
}