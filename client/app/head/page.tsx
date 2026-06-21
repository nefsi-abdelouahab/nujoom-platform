"use client";

import { useAuth } from "@/context/AuthContext";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import {
  getParticipantsForCommittee,
  getAssignmentsForCommittee,
  getCriteriaCountForCommittee,
} from "@/lib/utils";

export default function HeadOverviewPage() {
  const { currentUser, activeCommitteeId } = useAuth();
  const { scores } = useScores();
  const { committees, participants, assignments, criteria, users } = useAppData();

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
  const completedCount = committeeScores.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">
          مرحبًا، {currentUser.fullName}
        </h1>
        <p className="text-neutral-400 mt-1">{committee?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="عدد المشاركين" value={myParticipants.length.toString()} />
        <StatCard label="عدد المعايير" value={criteriaCount.toString()} />
        <StatCard
          label="درجات مُدخلة"
          value={`${completedCount} / ${totalExpected}`}
        />
        <StatCard
          label="درجات معتمدة"
          value={`${approvedCount} / ${completedCount}`}
          highlight={approvedCount < completedCount}
        />
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
        </div>
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