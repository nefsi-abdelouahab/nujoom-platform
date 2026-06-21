"use client";

import { useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import {
  getParticipantsForCommittee,
  getCriteriaCountForCommittee,
  getAssignmentsForCommittee,
  downloadCSV,
} from "@/lib/utils";
import { generateCommitteeReport, downloadBlob } from "@/lib/generateCommitteeReport";

export default function AdminReportsPage() {
  const { scores } = useScores();
  const { phases, categories, circles, committees, participants, assignments, criteria, users } =
    useAppData();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // ---- إحصائيات شاملة لكل لجنة ----
  const committeeRows = committees.map((committee) => {
    const committeeParticipants = getParticipantsForCommittee(committee.id, committees, participants);
    const criteriaCount = getCriteriaCountForCommittee(committee.id, assignments);
    const expected = committeeParticipants.length * criteriaCount;
    const committeeScores = scores.filter((s) => s.committeeId === committee.id);
    const approvedCount = committeeScores.filter((s) => s.approved).length;
    const completion = expected > 0 ? Math.round((committeeScores.length / expected) * 100) : 0;
    const phase = phases.find((p) => p.id === committee.phaseId);
    const circle = circles.find((c) => c.id === committee.circleId);
    const head = users.find((u) => u.id === committee.headUserId);
    const qualifiedCount = committeeParticipants.filter((p) => p.qualified).length;

    return {
      committee,
      phase,
      circle,
      head,
      phaseName: phase?.name || "—",
      circleName: circle?.name || "—",
      headName: head?.fullName || "غير محدد",
      participantsCount: committeeParticipants.length,
      qualifiedCount,
      criteriaCount,
      expected,
      entered: committeeScores.length,
      approvedCount,
      completion,
    };
  });

  // ---- توزيع المشاركين حسب الفئة (على مستوى كل المسابقة) ----
  const categoryDistribution = categories.map((cat) => ({
    category: cat,
    count: participants.filter((p) => p.categoryId === cat.id).length,
  }));

  // ---- توزيع المشاركين حسب الدائرة ----
  const circleDistribution = circles.map((circle) => ({
    circle,
    count: participants.filter((p) => p.circleId === circle.id).length,
  }));

  const totalExpected = committeeRows.reduce((sum, r) => sum + r.expected, 0);
  const totalEntered = committeeRows.reduce((sum, r) => sum + r.entered, 0);
  const totalApproved = committeeRows.reduce((sum, r) => sum + r.approvedCount, 0);
  const overallCompletion = totalExpected > 0 ? Math.round((totalEntered / totalExpected) * 100) : 0;

  function exportCommitteesReport() {
    const rows: (string | number)[][] = [
      ["اللجنة", "المرحلة", "الدائرة", "رئيس اللجنة", "عدد المشاركين", "عدد المعايير", "درجات مدخلة", "درجات معتمدة", "نسبة الإكمال %"],
      ...committeeRows.map((r) => [
        r.committee.name,
        r.phaseName,
        r.circleName,
        r.headName,
        r.participantsCount,
        r.criteriaCount,
        `${r.entered} / ${r.expected}`,
        r.approvedCount,
        r.completion,
      ]),
    ];
    downloadCSV("تقرير-اللجان.csv", rows);
  }

  function exportParticipantsReport() {
    const rows: (string | number)[][] = [
      ["الاسم", "تاريخ الميلاد", "العمر", "الفئة", "الدائرة", "البلدية", "المرحلة", "متأهل؟", "مُرحَّل؟"],
      ...participants.map((p) => [
        p.fullName,
        p.birthDate,
        p.age,
        categories.find((c) => c.id === p.categoryId)?.name || "—",
        circles.find((c) => c.id === p.circleId)?.name || "—",
        p.municipality,
        phases.find((ph) => ph.id === p.phaseId)?.name || "—",
        p.qualified ? "نعم" : "لا",
        p.advanced ? "نعم" : "لا",
      ]),
    ];
    downloadCSV("تقرير-المشاركين.csv", rows);
  }

  async function exportCommitteeWordReport(committeeId: string) {
    setGeneratingId(committeeId);
    try {
      const row = committeeRows.find((r) => r.committee.id === committeeId);
      if (!row) return;

      const committeeParticipants = getParticipantsForCommittee(committeeId, committees, participants);
      const qualifiedParticipants = committeeParticipants.filter((p) => p.qualified);
      const committeeAssignments = getAssignmentsForCommittee(committeeId, assignments, criteria, users);

      const blob = await generateCommitteeReport({
        committee: row.committee,
        phase: row.phase,
        circle: row.circle,
        head: row.head,
        judges: committeeAssignments.map((a) => ({ judge: a.judge, criterion: a.criterion })),
        allParticipants: committeeParticipants,
        qualifiedParticipants,
        categories,
      });

      downloadBlob(`محضر-${row.committee.name}.docx`, blob);
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">التقارير والإحصائيات</h1>
          <p className="text-neutral-400 mt-1">نظرة شاملة على سير المسابقة، قابلة للتصدير كملفات CSV أو محاضر Word رسمية</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCommitteesReport}
            className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10"
          >
            تصدير تقرير اللجان (CSV)
          </button>
          <button
            onClick={exportParticipantsReport}
            className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10"
          >
            تصدير المشاركين (CSV)
          </button>
        </div>
      </div>

      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="إجمالي المشاركين" value={participants.length.toString()} />
        <StatCard label="إجمالي اللجان" value={committees.length.toString()} />
        <StatCard label="نسبة إكمال التقييم" value={`${overallCompletion}%`} />
        <StatCard label="درجات معتمدة" value={`${totalApproved} / ${totalEntered}`} />
      </div>

      {/* جدول اللجان + محاضر Word */}
      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-4">تفاصيل سير العمل لكل لجنة — ومحضر مداولات رسمي</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-right">
                <th className="py-2 px-3 text-neutral-400 font-medium">اللجنة</th>
                <th className="py-2 px-3 text-neutral-400 font-medium">المرحلة</th>
                <th className="py-2 px-3 text-neutral-400 font-medium">المشاركون</th>
                <th className="py-2 px-3 text-neutral-400 font-medium">المتأهلون</th>
                <th className="py-2 px-3 text-neutral-400 font-medium">نسبة الإكمال</th>
                <th className="py-2 px-3 text-neutral-400 font-medium">محضر اللجنة</th>
              </tr>
            </thead>
            <tbody>
              {committeeRows.map((r) => (
                <tr key={r.committee.id} className="border-b border-neutral-800/60">
                  <td className="py-2.5 px-3 text-neutral-100">{r.committee.name}</td>
                  <td className="py-2.5 px-3 text-neutral-500">{r.phaseName}</td>
                  <td className="py-2.5 px-3 text-neutral-300">{r.participantsCount}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{r.qualifiedCount}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${Math.min(r.completion, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{r.completion}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => exportCommitteeWordReport(r.committee.id)}
                      disabled={generatingId === r.committee.id}
                      className="rounded-md border border-sky-500/30 px-3 py-1.5 text-xs text-sky-300 transition hover:bg-sky-500/10 disabled:opacity-40 whitespace-nowrap"
                    >
                      {generatingId === r.committee.id ? "جاري التوليد..." : "تصدير Word"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* توزيع الفئات والدوائر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
          <h2 className="text-amber-400 font-semibold mb-4">توزيع المشاركين حسب الفئة</h2>
          <div className="flex flex-col gap-3">
            {categoryDistribution.map(({ category, count }) => (
              <DistributionRow key={category.id} label={category.name} count={count} total={participants.length} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
          <h2 className="text-amber-400 font-semibold mb-4">توزيع المشاركين حسب الدائرة</h2>
          <div className="flex flex-col gap-3">
            {circleDistribution.map(({ circle, count }) => (
              <DistributionRow key={circle.id} label={circle.name} count={count} total={participants.length} />
            ))}
            {circleDistribution.length === 0 && (
              <p className="text-sm text-neutral-500">لا توجد دوائر بعد</p>
            )}
          </div>
        </div>
      </div>
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

function DistributionRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-neutral-300">{label}</span>
        <span className="text-neutral-500">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}