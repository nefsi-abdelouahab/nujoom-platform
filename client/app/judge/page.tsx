"use client";

import { useAuth } from "@/context/AuthContext";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import {
  getParticipantsForCommittee,
  getCriterionById,
} from "@/lib/utils";

export default function JudgeOverviewPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { scores } = useScores();
  const { committees, criteria, participants } = useAppData();

  if (!currentUser || !activeCommitteeId) {
    return <p className="text-neutral-400">جاري التحميل...</p>;
  }

  const committee = committees.find((c) => c.id === activeCommitteeId);
  const criterion = getCriterionById(currentUser.criterionId || "", criteria);
  const myParticipants = getParticipantsForCommittee(activeCommitteeId, committees, participants);

  const myScoresCount = scores.filter(
    (s) =>
      s.judgeUserId === currentUser.id &&
      s.committeeId === activeCommitteeId
  ).length;

  const remaining = myParticipants.length - myScoresCount;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">
          مرحبًا، {currentUser.fullName}
        </h1>
        <p className="text-neutral-400 mt-1">{committee?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="المعيار المخصص لك" value={criterion?.name || "—"} />
        <StatCard label="عدد المشاركين" value={myParticipants.length.toString()} />
        <StatCard
          label="بقي تقييمه"
          value={remaining.toString()}
          highlight={remaining > 0}
        />
      </div>

      <div className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6">
        <h2 className="text-amber-400 font-semibold mb-2">مؤشرات معيارك</h2>
        {criterion ? (
          <ul className="flex flex-col gap-2">
            {criterion.indicators.map((ind) => (
              <li
                key={ind.id}
                className="flex justify-between text-sm text-neutral-300 border-b border-neutral-800 pb-2"
              >
                <span>{ind.name}</span>
                <span className="text-amber-300">{ind.maxScore} نقطة</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500 text-sm">لا يوجد معيار مخصص لك حاليًا</p>
        )}
      </div>
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
        highlight
          ? "border-amber-400/40 bg-amber-500/5"
          : "border-neutral-800 bg-neutral-900/50"
      }`}
    >
      <p className="text-xs text-neutral-400">{label}</p>
      <p
        className={`text-xl font-bold mt-1 ${
          highlight ? "text-amber-300" : "text-neutral-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}