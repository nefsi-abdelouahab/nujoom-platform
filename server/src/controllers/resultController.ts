import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Committee } from "../models/Committee";
import { Participant } from "../models/Participant";
import { Score } from "../models/Score";
import { Category } from "../models/Category";
import { calculateParticipantAverage, getRankWithTies } from "../utils/businessLogic";

/**
 * يبني نتائج لجنة معيّنة: لكل فئة، قائمة مشاركين مرتّبة تنازليًا بالمعدل،
 * مع ترتيب يطبّق قاعدة "لا يتم كسر التعادل" (getRankWithTies).
 * يقابل صفحة /admin/results و /head نتائج اللجنة في الفرونت إند تمامًا.
 */
async function buildCommitteeResults(committeeId: string) {
  const committee = await Committee.findById(committeeId);
  if (!committee) return null;

  const participantFilter: Record<string, unknown> = { phaseId: committee.phaseId };
  if (committee.circleId) participantFilter.circleId = committee.circleId;

  const [participants, scores, categories] = await Promise.all([
    Participant.find(participantFilter),
    Score.find({ committeeId }),
    Category.find().sort({ order: 1 }),
  ]);

  // فهرسة الدرجات حسب participantId لتسريع البحث (بدل .filter داخل كل حلقة)
  const scoresByParticipant = new Map<string, { criterionId: string; total: number }[]>();
  for (const s of scores) {
    const key = s.participantId.toString();
    const list = scoresByParticipant.get(key) || [];
    list.push({ criterionId: s.criterionId.toString(), total: s.total });
    scoresByParticipant.set(key, list);
  }

  const resultsByCategory = categories.map((category) => {
    const categoryParticipants = participants.filter(
      (p) => p.categoryId.toString() === category._id.toString()
    );

    const withAverage = categoryParticipants.map((p) => {
      const { average, criteriaScores } = calculateParticipantAverage(
        scoresByParticipant.get(p._id.toString()) || []
      );
      return { participant: p, average, criteriaScores };
    });

    // ترتيب تنازلي بالمعدل
    withAverage.sort((a, b) => b.average - a.average);

    // إضافة الترتيب مع قاعدة عدم كسر التعادل
    const ranked = withAverage.map((item, index) => ({
      ...item,
      rank: getRankWithTies(withAverage, index),
    }));

    return { category, participants: ranked };
  });

  return { committee, resultsByCategory };
}

/**
 * GET /api/admin/committees/:id/results
 * المدير يمكنه عرض نتائج أي لجنة عبر تمرير id في الرابط.
 */
export async function getCommitteeResultsAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const results = await buildCommitteeResults(id);
  if (!results) return res.status(404).json({ error: "اللجنة غير موجودة" });
  res.json(results);
}

/**
 * GET /api/head/results
 * رئيس اللجنة يرى نتائج لجنته النشطة فقط (من activeCommitteeId في التوكن).
 */
export async function getOwnCommitteeResults(req: AuthRequest, res: Response) {
  const committeeId = req.auth!.activeCommitteeId!;
  const results = await buildCommitteeResults(committeeId);
  if (!results) return res.status(404).json({ error: "اللجنة غير موجودة" });
  res.json(results);
}