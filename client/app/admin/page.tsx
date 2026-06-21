"use client";

import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";

export default function AdminOverviewPage() {
  const { scores } = useScores();
  const { phases, categories, circles, committees, participants, users } = useAppData();

  const judgesCount = users.filter((u) => u.role === "judge").length;
  const headsCount = users.filter((u) => u.role === "head").length;
  const approvedScores = scores.filter((s) => s.approved).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">نظرة عامة على المسابقة</h1>
        <p className="text-neutral-400 mt-1">مسابقة نجوم القراءة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="المراحل" value={phases.length.toString()} />
        <StatCard label="الفئات" value={categories.length.toString()} />
        <StatCard label="الدوائر" value={circles.length.toString()} />
        <StatCard label="اللجان" value={committees.length.toString()} />
        <StatCard label="المحكّمون" value={judgesCount.toString()} />
        <StatCard label="رؤساء اللجان" value={headsCount.toString()} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="عدد المشاركين الكلي" value={participants.length.toString()} />
        <StatCard label="درجات مُدخلة" value={scores.length.toString()} />
        <StatCard
          label="درجات معتمدة"
          value={`${approvedScores} / ${scores.length}`}
        />
      </div>

      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-4">هيكلة المسابقة</h2>
        <div className="flex flex-col gap-3">
          {phases.map((phase) => {
            const phaseCommittees = committees.filter((c) => c.phaseId === phase.id);
            return (
              <div
                key={phase.id}
                className="flex items-center justify-between border-b border-neutral-800 pb-3"
              >
                <span className="text-neutral-100 font-medium">{phase.name}</span>
                <span className="text-sm text-neutral-500">
                  {phaseCommittees.length} لجنة/لجان
                </span>
              </div>
            );
          })}
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