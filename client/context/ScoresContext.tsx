"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Score } from "@/types";
import { scores as initialScores } from "@/lib/mock-data";

interface ScoresContextType {
  scores: Score[];
  saveScore: (score: Omit<Score, "id">) => void;
  approveScore: (scoreId: string) => void;
  approveMany: (scoreIds: string[]) => void;
  getScoresCountForParticipant: (participantId: string) => number;
  deleteScoresForParticipant: (participantId: string) => void;
  getScoresCountForCriterion: (criterionId: string) => number;
  deleteScoresForCriterion: (criterionId: string) => void;
}

const ScoresContext = createContext<ScoresContextType | undefined>(undefined);

export function ScoresProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<Score[]>(initialScores);

  function saveScore(input: Omit<Score, "id">) {
    setScores((prev) => {
      // إن وُجدت درجة سابقة لنفس (المشارك + اللجنة + المعيار + المحكّم) نحدّثها، وإلا نضيف جديدة
      const existingIndex = prev.findIndex(
        (s) =>
          s.participantId === input.participantId &&
          s.committeeId === input.committeeId &&
          s.criterionId === input.criterionId &&
          s.judgeUserId === input.judgeUserId
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...input };
        return updated;
      }

      return [
        ...prev,
        { ...input, id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ];
    });
  }

  function approveScore(scoreId: string) {
    setScores((prev) =>
      prev.map((s) => (s.id === scoreId ? { ...s, approved: true } : s))
    );
  }

  function approveMany(scoreIds: string[]) {
    const idSet = new Set(scoreIds);
    setScores((prev) =>
      prev.map((s) => (idSet.has(s.id) ? { ...s, approved: true } : s))
    );
  }

  function getScoresCountForParticipant(participantId: string): number {
    return scores.filter((s) => s.participantId === participantId).length;
  }

  function deleteScoresForParticipant(participantId: string) {
    setScores((prev) => prev.filter((s) => s.participantId !== participantId));
  }

  function getScoresCountForCriterion(criterionId: string): number {
    return scores.filter((s) => s.criterionId === criterionId).length;
  }

  function deleteScoresForCriterion(criterionId: string) {
    setScores((prev) => prev.filter((s) => s.criterionId !== criterionId));
  }

  return (
    <ScoresContext.Provider
      value={{
        scores,
        saveScore,
        approveScore,
        approveMany,
        getScoresCountForParticipant,
        deleteScoresForParticipant,
        getScoresCountForCriterion,
        deleteScoresForCriterion,
      }}
    >
      {children}
    </ScoresContext.Provider>
  );
}

export function useScores() {
  const ctx = useContext(ScoresContext);
  if (!ctx) {
    throw new Error("useScores must be used within ScoresProvider");
  }
  return ctx;
}