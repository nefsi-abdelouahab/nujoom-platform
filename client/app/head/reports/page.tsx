"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import {
  getParticipantsForCommittee,
  getAssignmentsForCommittee,
  getCriteriaCountForCommittee,
  calculateParticipantAverage,
  downloadCSV,
} from "@/lib/utils";
import { generateCommitteeReport, downloadBlob } from "@/lib/generateCommitteeReport";

export default function HeadReportsPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { scores } = useScores();
  const { committees, participants, categories, assignments, criteria, users } = useAppData();
  const [generatingWord, setGeneratingWord] = useState(false);

  if (!currentUser || !activeCommitteeId) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  const committee = committees.find((c) => c.id === activeCommitteeId);
  const myParticipants = getParticipantsForCommittee(activeCommitteeId, committees, participants);
  const committeeAssignments = getAssignmentsForCommittee(activeCommitteeId, assignments, criteria, users);
  const criteriaCount = getCriteriaCountForCommittee(activeCommitteeId, assignments);

  const committeeScores = scores.filter((s) => s.committeeId === activeCommitteeId);
  const approvedCount = committeeScores.filter((s) => s.approved).length;
  const totalExpected = myParticipants.length * criteriaCount;
  const completion = totalExpected > 0 ? Math.round((committeeScores.length / totalExpected) * 100) : 0;

  const categoryResults = categories
    .map((cat) => {
      const rows = myParticipants
        .filter((p) => p.categoryId === cat.id)
        .map((p) => ({
          participant: p,
          ...calculateParticipantAverage(p.id, activeCommitteeId, scores),
        }))
        .sort((a, b) => b.average - a.average);
      return { category: cat, rows };
    })
    .filter((c) => c.rows.length > 0);

  function exportReport() {
    const rows: (string | number)[][] = [
      ["الفئة", "الترتيب", "الاسم", "المعدل", "متأهل؟", "حالة التقييم"],
    ];

    categoryResults.forEach(({ category, rows: categoryRows }) => {
      categoryRows.forEach((r, index) => {
        const prevAverage = index > 0 ? categoryRows[index - 1].average : null;
        const rank =
          prevAverage === r.average
            ? categoryRows.findIndex((cr) => cr.average === r.average) + 1
            : index + 1;

        rows.push([
          category.name,
          rank,
          r.participant.fullName,
          r.average.toFixed(2),
          r.participant.qualified ? "نعم" : "لا",
          r.criteriaScores.length === 0 ? "لم يُقيَّم" : `${r.criteriaScores.length} معيار مُقيَّم`,
        ]);
      });
    });

    downloadCSV(`تقرير-${committee?.name || "اللجنة"}.csv`, rows);
  }

  async function exportWordReport() {
    if (!committee) return;
    setGeneratingWord(true);
    try {
      const head = users.find((u) => u.id === committee.headUserId);
      const qualifiedParticipants = myParticipants.filter((p) => p.qualified);

      const blob = await generateCommitteeReport({
        committee,
        head,
        judges: committeeAssignments.map((a) => ({ judge: a.judge, criterion: a.criterion })),
        allParticipants: myParticipants,
        qualifiedParticipants,
        categories,
      });

      downloadBlob(`محضر-${committee.name}.docx`, blob);
    } finally {
      setGeneratingWord(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">تقرير اللجنة</h1>
          <p className="text-neutral-400 mt-1">{committee?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportReport}
            className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10"
          >
            تصدير التقرير (CSV)
          </button>
          <button
            onClick={exportWordReport}
            disabled={generatingWord}
            className="rounded-lg border border-sky-500/30 px-4 py-2 text-sm text-sky-300 transition hover:bg-sky-500/10 disabled:opacity-40"
          >
            {generatingWord ? "جاري التوليد..." : "تصدير محضر اللجنة (Word)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="عدد المشاركين" value={myParticipants.length.toString()} />
        <StatCard label="عدد المعايير" value={criteriaCount.toString()} />
        <StatCard label="نسبة إكمال التقييم" value={`${completion}%`} />
        <StatCard label="درجات معتمدة" value={`${approvedCount} / ${committeeScores.length}`} />
      </div>

      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-4">توزيع المعايير على المحكّمين</h2>
        <div className="flex flex-col gap-2">
          {committeeAssignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between text-sm border-b border-neutral-800 pb-2"
            >
              <span className="text-neutral-300">{a.criterion?.name}</span>
              <span className="text-neutral-500">{a.judge?.fullName}</span>
            </div>
          ))}
          {committeeAssignments.length === 0 && (
            <p className="text-sm text-neutral-500">لا توجد تعيينات بعد</p>
          )}
        </div>
      </div>

      {categoryResults.map(({ category, rows }) => (
        <div key={category.id} className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
          <h2 className="text-amber-400 font-semibold mb-4">فئة {category.name}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-right">
                  <th className="py-2 px-3 text-neutral-400 font-medium">الترتيب</th>
                  <th className="py-2 px-3 text-neutral-400 font-medium">الاسم</th>
                  <th className="py-2 px-3 text-neutral-400 font-medium">المعدل</th>
                  <th className="py-2 px-3 text-neutral-400 font-medium">متأهل</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, index) => {
                  const prevAverage = index > 0 ? rows[index - 1].average : null;
                  const rank =
                    prevAverage === r.average
                      ? rows.findIndex((row) => row.average === r.average) + 1
                      : index + 1;

                  return (
                    <tr key={r.participant.id} className="border-b border-neutral-800/60">
                      <td className="py-2.5 px-3 text-neutral-300">{rank}</td>
                      <td className="py-2.5 px-3 text-neutral-100">{r.participant.fullName}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">{r.average.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        {r.participant.qualified ? (
                          <span className="text-xs text-emerald-400">متأهل ✓</span>
                        ) : (
                          <span className="text-xs text-neutral-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {myParticipants.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-8">لا يوجد مشاركون في هذه اللجنة</p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-xl font-bold text-neutral-100 mt-1">{value}</p>
    </div>
  );
}