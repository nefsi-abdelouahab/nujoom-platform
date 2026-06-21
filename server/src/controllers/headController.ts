import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Committee } from "../models/Committee";
import { Participant } from "../models/Participant";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";
import { Score } from "../models/Score";
import { User } from "../models/User";
import { Criterion } from "../models/Criterion";
import { saveScoreShared, approveScoreShared, approveManyShared } from "./scoreController";
import { advanceQualifiedParticipants as advanceLogic } from "./participantController";

// ---- نظرة عامة على لجنة رئيس اللجنة ----
export async function getOverview(req: AuthRequest, res: Response) {
  const committeeId = req.auth!.activeCommitteeId!;
  const committee = await Committee.findById(committeeId);
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const participantFilter: Record<string, unknown> = { phaseId: committee.phaseId };
  if (committee.circleId) participantFilter.circleId = committee.circleId;

  const [participantCount, assignments] = await Promise.all([
    Participant.countDocuments(participantFilter),
    CommitteeCriterionAssignment.find({ committeeId }).populate("criterionId").populate(
      "judgeUserId",
      "-passwordHash"
    ),
  ]);

  const uniqueCriteriaCount = new Set(assignments.map((a) => a.criterionId._id.toString())).size;

  res.json({ committee, participantCount, criteriaCount: uniqueCriteriaCount, assignments });
}

// ---- مشاركو لجنة رئيس اللجنة ----
export async function getParticipants(req: AuthRequest, res: Response) {
  const committeeId = req.auth!.activeCommitteeId!;
  const committee = await Committee.findById(committeeId);
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const filter: Record<string, unknown> = { phaseId: committee.phaseId };
  if (committee.circleId) filter.circleId = committee.circleId;

  const participants = await Participant.find(filter);
  res.json(participants);
}

// ---- مصفوفة المراجعة (/head/review) ----
export async function getReviewMatrix(req: AuthRequest, res: Response) {
  const committeeId = req.auth!.activeCommitteeId!;
  const committee = await Committee.findById(committeeId);
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const filter: Record<string, unknown> = { phaseId: committee.phaseId };
  if (committee.circleId) filter.circleId = committee.circleId;

  const [participants, assignments, scores] = await Promise.all([
    Participant.find(filter),
    CommitteeCriterionAssignment.find({ committeeId }).populate("criterionId").populate(
      "judgeUserId",
      "-passwordHash"
    ),
    Score.find({ committeeId }),
  ]);

  res.json({ participants, assignments, scores });
}

// ---- تأهيل مشارك يدويًا ----
export async function setQualified(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { qualified } = req.body;
  const participant = await Participant.findByIdAndUpdate(id, { qualified: !!qualified }, { new: true });
  if (!participant) return res.status(404).json({ error: "المشارك غير موجود" });
  res.json(participant);
}

// ---- ترحيل المتأهلين فعليًا ----
export async function advanceQualified(req: AuthRequest, res: Response) {
  req.params.id = req.auth!.activeCommitteeId!;
  return advanceLogic(req as any, res);
}

// ---- حفظ درجة (رئيس اللجنة يقيّم معياره الخاص) ----
export async function saveOwnScore(req: AuthRequest, res: Response) {
  const userId = req.auth!.userId;
  const committeeId = req.auth!.activeCommitteeId!;
  const { participantId, indicatorScores } = req.body;

  const user = await User.findById(userId);
  if (!user?.criterionId) {
    return res.status(400).json({ error: "لا يوجد معيار مخصص لهذا المستخدم" });
  }

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

export async function approveScore(req: AuthRequest, res: Response) {
  const { scoreId } = req.params;
  const score = await approveScoreShared(scoreId);
  if (!score) return res.status(404).json({ error: "الدرجة غير موجودة" });
  res.json(score);
}

export async function approveMany(req: AuthRequest, res: Response) {
  const { scoreIds } = req.body;
  if (!Array.isArray(scoreIds) || scoreIds.length === 0) {
    return res.status(400).json({ error: "scoreIds مطلوبة كمصفوفة غير فاضية" });
  }
  await approveManyShared(scoreIds);
  res.json({ success: true, approvedCount: scoreIds.length });
}