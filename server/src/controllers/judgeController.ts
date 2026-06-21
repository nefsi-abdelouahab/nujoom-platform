import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Committee } from "../models/Committee";
import { Participant } from "../models/Participant";
import { User } from "../models/User";
import { Criterion } from "../models/Criterion";
import { Score } from "../models/Score";
import { saveScoreShared } from "./scoreController";

export async function getOverview(req: AuthRequest, res: Response) {
  const committeeId = req.auth!.activeCommitteeId!;
  const user = await User.findById(req.auth!.userId);
  if (!user?.criterionId) {
    return res.status(400).json({ error: "لا يوجد معيار مخصص لهذا المحكّم" });
  }

  const criterion = await Criterion.findById(user.criterionId);

  const committee = await Committee.findById(committeeId);
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const filter: Record<string, unknown> = { phaseId: committee.phaseId };
  if (committee.circleId) filter.circleId = committee.circleId;
  const participantCount = await Participant.countDocuments(filter);

  const scoredCount = await Score.countDocuments({
    committeeId,
    criterionId: user.criterionId,
    judgeUserId: req.auth!.userId,
  });

  res.json({ criterion, participantCount, scoredCount, remainingCount: participantCount - scoredCount });
}

export async function getParticipants(req: AuthRequest, res: Response) {
  const committeeId = req.auth!.activeCommitteeId!;
  const committee = await Committee.findById(committeeId);
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const filter: Record<string, unknown> = { phaseId: committee.phaseId };
  if (committee.circleId) filter.circleId = committee.circleId;

  const participants = await Participant.find(filter);

  // الدرجات الخاصة بهذا المحكّم فقط، لعرض حالة كل مشارك (مُقيَّم/غير مُقيَّم) في الواجهة
  const user = await User.findById(req.auth!.userId);
  const myScores = await Score.find({
    committeeId,
    criterionId: user?.criterionId,
    judgeUserId: req.auth!.userId,
  });

  res.json({ participants, myScores });
}

export async function saveScore(req: AuthRequest, res: Response) {
  const userId = req.auth!.userId;
  const committeeId = req.auth!.activeCommitteeId!;
  const { participantId, indicatorScores } = req.body;

  const user = await User.findById(userId);
  if (!user?.criterionId) {
    return res.status(400).json({ error: "لا يوجد معيار مخصص لهذا المحكّم" });
  }

  // أمان: judgeUserId يُؤخذ دائمًا من التوكن، لا من الطلب — لا يمكن لمحكّم
  // أن يُدخل درجة باسم محكّم آخر (مطابق للقسم 16.4، نقطة 2).
  const result = await saveScoreShared({
    participantId,
    committeeId,
    criterionId: user.criterionId.toString(),
    judgeUserId: userId,
    indicatorScores,
  });

  if ("error" in result) return res?.status(result.status).json({ error: result.error });
  res.json(result.score);
}