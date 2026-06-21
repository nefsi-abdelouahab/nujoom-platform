"use client";

import { useState } from "react";
import { useScores } from "@/context/ScoresContext";
import { useAppData } from "@/context/AppDataContext";
import {
  getParticipantsForCommittee,
  calculateParticipantAverage,
} from "@/lib/utils";

export default function ResultsPage() {
  const { scores } = useScores();
  const { committees, categories, participants } = useAppData();
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(committees[0]?.id || "");

  const committeeParticipants = getParticipantsForCommittee(
    selectedCommitteeId,
    committees,
    participants
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">النتائج والترتيب</h1>
        <p className="text-neutral-400 mt-1">
          الترتيب يتم داخل كل فئة على حدة — لا يتم كسر التعادل
        </p>
      </div>

      <select
        value={selectedCommitteeId}
        onChange={(e) => setSelectedCommitteeId(e.target.value)}
        className="w-fit rounded-lg border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-neutral-100 outline-none focus:border-amber-400"
      >
        {committees.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {categories.map((cat) => {
        const categoryParticipants = committeeParticipants
          .filter((p) => p.categoryId === cat.id)
          .map((p) => ({
            participant: p,
            ...calculateParticipantAverage(p.id, selectedCommitteeId, scores),
          }))
          .sort((a, b) => b.average - a.average);

        if (categoryParticipants.length === 0) return null;

        return (
          <div
            key={cat.id}
            className="rounded-2xl border border-amber-500/15 bg-neutral-900/50 p-6"
          >
            <h2 className="text-amber-400 font-semibold mb-4">فئة {cat.name}</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-right">
                    <th className="py-2 px-3 text-neutral-400 font-medium">الترتيب</th>
                    <th className="py-2 px-3 text-neutral-400 font-medium">الاسم</th>
                    <th className="py-2 px-3 text-neutral-400 font-medium">المعدل</th>
                    <th className="py-2 px-3 text-neutral-400 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryParticipants.map(({ participant, average, criteriaScores }, index) => {
                    const prevAverage = index > 0 ? categoryParticipants[index - 1].average : null;
                    const rank =
                      prevAverage === average
                        ? categoryParticipants.findIndex((cp) => cp.average === average) + 1
                        : index + 1;

                    return (
                      <tr key={participant.id} className="border-b border-neutral-800/60">
                        <td className="py-2.5 px-3 text-neutral-300">{rank}</td>
                        <td className="py-2.5 px-3 text-neutral-100">{participant.fullName}</td>
                        <td className="py-2.5 px-3 text-amber-300 font-semibold">
                          {average.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3">
                          {criteriaScores.length === 0 ? (
                            <span className="text-xs text-neutral-600">لم يُقيَّم</span>
                          ) : (
                            <span className="text-xs text-emerald-400">
                              {criteriaScores.length} معيار مُقيَّم
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {committeeParticipants.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-8">
          لا يوجد مشاركون في هذه اللجنة
        </p>
      )}
    </div>
  );
}