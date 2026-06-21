"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { apiRequest, normalizeId, normalizeIds, ApiError } from "@/lib/api";
import { Score } from "@/types";

interface ScoresContextType {
  scores: Score[];
  isLoadingScores: boolean;
  loadScoresForCommittee: (committeeId: string, role: "head" | "judge" | "admin") => Promise<void>;
  saveScore: (input: Omit<Score, "id">) => Promise<void>;
  approveScore: (scoreId: string) => Promise<void>;
  approveMany: (scoreIds: string[]) => Promise<void>;
  getScoresCountForParticipant: (participantId: string) => number;
  deleteScoresForParticipant: (participantId: string) => void;
  getScoresCountForCriterion: (criterionId: string) => number;
  deleteScoresForCriterion: (criterionId: string) => void;
}

const ScoresContext = createContext<ScoresContextType | undefined>(undefined);

function normalizeScore(raw: Record<string, unknown>): Score {
  return normalizeId(raw) as unknown as Score;
}

export function ScoresProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);

  // تُستدعى من صفحات head/judge/admin عند تحميل اللجنة النشطة
  const loadScoresForCommittee = useCallback(
    async (committeeId: string, role: "head" | "judge" | "admin") => {
      setIsLoadingScores(true);
      try {
        let data: Record<string, unknown>[];
        if (role === "admin") {
          // Admin يجلب عبر نتائج اللجنة (التفصيل يأتي من results endpoint)
          // للمراجعة نجلب من head/review مع تمرير committeeId كـ admin
          data = await apiRequest<Record<string, unknown>[]>(
            `/admin/committees/${committeeId}/results`
          ).then((r: any) => {
            // نستخرج الدرجات من داخل النتائج (flat)
            const allScores: Record<string, unknown>[] = [];
            (r.resultsByCategory || []).forEach((cat: any) => {
              (cat.participants || []).forEach((item: any) => {
                // النتائج لا تحمل درجات تفصيلية هنا، نحتاج endpoint منفصل
              });
            });
            return allScores;
          });
          // Admin لا يحتاج scores في state عادةً — review/results تُجلب في صفحاتها
          setScores([]);
          return;
        }

        if (role === "head") {
          const reviewData = await apiRequest<{
            scores: Record<string, unknown>[];
          }>("/head/review");
          data = reviewData.scores || [];
        } else {
          const overviewData = await apiRequest<{
            myScores: Record<string, unknown>[];
          }>("/judge/participants");
          data = overviewData.myScores || [];
        }

        setScores(normalizeIds(data) as unknown as Score[]);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return;
        console.error("فشل تحميل الدرجات:", err);
      } finally {
        setIsLoadingScores(false);
      }
    },
    []
  );

  async function saveScore(input: Omit<Score, "id">) {
    // الـ endpoint يُحدَّد حسب من يستدعيها:
    // ScoringForm في /judge/scoring → /judge/scores
    // ScoringForm في /head/scoring → /head/scores
    // نُمرِّر endpoint كجزء من المدخلات أو نعتمد على role في التوكن
    // الباك إند يستخرج judgeUserId من التوكن دائمًا
    const endpoint = input.judgeUserId ? "/judge/scores" : "/judge/scores";

    try {
      const saved = await apiRequest<Record<string, unknown>>(endpoint, {
        method: "POST",
        body: {
          participantId: input.participantId,
          indicatorScores: input.indicatorScores,
        },
      });
      const normalized = normalizeScore(saved);

      setScores((prev) => {
        const idx = prev.findIndex(
          (s) =>
            s.participantId === input.participantId &&
            s.committeeId === input.committeeId &&
            s.criterionId === input.criterionId &&
            s.judgeUserId === input.judgeUserId
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = normalized;
          return updated;
        }
        return [...prev, normalized];
      });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw err;
    }
  }

  async function approveScore(scoreId: string) {
    await apiRequest(`/head/scores/${scoreId}/approve`, { method: "POST" });
    setScores((prev) =>
      prev.map((s) => (s.id === scoreId ? { ...s, approved: true } : s))
    );
  }

  async function approveMany(scoreIds: string[]) {
    await apiRequest("/head/scores/approve-many", {
      method: "POST",
      body: { scoreIds },
    });
    const idSet = new Set(scoreIds);
    setScores((prev) =>
      prev.map((s) => (idSet.has(s.id) ? { ...s, approved: true } : s))
    );
  }

  // هذه الدوال تبقى synchronous لأن الصفحات تستدعيها قبل حذف الكيان
  // والباك إند يتولى الحذف الفعلي للدرجات المرتبطة تلقائيًا
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
        isLoadingScores,
        loadScoresForCommittee,
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
  if (!ctx) throw new Error("useScores must be used within ScoresProvider");
  return ctx;
}