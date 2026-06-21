import { Request, Response } from "express";
import { Committee } from "../models/Committee";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";
import { Participant } from "../models/Participant";
import { Score } from "../models/Score";

export async function listCommittees(_req: Request, res: Response) {
  const committees = await Committee.find();
  res.json(committees);
}

export async function createCommittee(req: Request, res: Response) {
  const { name, phaseId, circleId, headUserId } = req.body;
  if (!name || !phaseId) return res.status(400).json({ error: "name و phaseId مطلوبان" });
  const committee = await Committee.create({ name, phaseId, circleId, headUserId });
  res.status(201).json(committee);
}

export async function updateCommittee(req: Request, res: Response) {
  const { id } = req.params;
  const { name, phaseId, circleId, headUserId } = req.body;
  const committee = await Committee.findByIdAndUpdate(
    id,
    {
      ...(name && { name }),
      ...(phaseId && { phaseId }),
      ...(circleId !== undefined && { circleId }),
      ...(headUserId !== undefined && { headUserId }),
    },
    { new: true }
  );
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });
  res.json(committee);
}

/**
 * حذف لجنة: يفحص التعيينات + المشاركين المرتبطين بدائرة اللجنة نفسها
 * (يطابق منطق deleteCommittee في AppDataContext — المقارنة عبر circleId اللجنة،
 * راجع الملاحظة في القسم 5 من التوثيق حول صياغته غير المباشرة لكنه يعمل صحيحًا).
 */
export async function deleteCommittee(req: Request, res: Response) {
  const { id } = req.params;
  const confirm = req.query.confirm === "true";

  const committee = await Committee.findById(id);
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const [relatedAssignments, relatedParticipants] = await Promise.all([
    CommitteeCriterionAssignment.countDocuments({ committeeId: id }),
    committee.circleId
      ? Participant.countDocuments({ circleId: committee.circleId })
      : Promise.resolve(0),
  ]);

  const parts: string[] = [];
  if (relatedAssignments) parts.push(`${relatedAssignments} تعيين محكّم`);
  if (relatedParticipants) parts.push(`${relatedParticipants} مشارك مرتبط`);

  if (parts.length > 0 && !confirm) {
    return res.json({ success: false, relatedSummary: parts.join(" و ") });
  }

  if (confirm) {
    await CommitteeCriterionAssignment.deleteMany({ committeeId: id });
  }

  await Committee.findByIdAndDelete(id);
  res.json({ success: true });
}

/**
 * GET /api/admin/committees/:id/assignments
 * يقابل getAssignmentsForCommittee في lib/utils.ts — مع populate لاسم المعيار والمحكّم
 */
export async function getCommitteeAssignments(req: Request, res: Response) {
  const { id } = req.params;
  const assignments = await CommitteeCriterionAssignment.find({ committeeId: id })
    .populate("criterionId")
    .populate("judgeUserId", "-passwordHash");
  res.json(assignments);
}

/**
 * POST /api/admin/committees/:id/assignments
 * يقابل addCommitteeCriterionAssignment — يسمح بعدة محكّمين لنفس المعيار،
 * يمنع فقط نفس المحكّم + نفس المعيار مرتين (يتولى ذلك Unique index في الـ Model نفسه).
 */
export async function addAssignment(req: Request, res: Response) {
  const { id: committeeId } = req.params;
  const { criterionId, judgeUserId } = req.body;

  if (!criterionId || !judgeUserId) {
    return res.status(400).json({ error: "criterionId و judgeUserId مطلوبان" });
  }

  try {
    const assignment = await CommitteeCriterionAssignment.create({
      committeeId,
      criterionId,
      judgeUserId,
    });
    res.status(201).json(assignment);
  } catch (err: any) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "هذا المحكّم مُعيَّن بالفعل على هذا المعيار في هذه اللجنة" });
    }
    throw err;
  }
}

// حذف تعيين فردي — غير محمي (يطابق deleteAssignment في AppDataContext)
export async function deleteAssignment(req: Request, res: Response) {
  const { assignmentId } = req.params;
  const deleted = await CommitteeCriterionAssignment.findByIdAndDelete(assignmentId);
  if (!deleted) return res.status(404).json({ error: "التعيين غير موجود" });
  res.json({ success: true });
}