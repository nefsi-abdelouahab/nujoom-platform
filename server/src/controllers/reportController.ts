import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Committee } from "../models/Committee";
import { Phase } from "../models/Phase";
import { Circle } from "../models/Circle";
import { Participant } from "../models/Participant";
import { Category } from "../models/Category";
import { User } from "../models/User";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";
import { generateCommitteeReport, CommitteeReportData } from "../utils/generateCommitteeReport";

/**
 * يجمع كل بيانات لجنة معيّنة المطلوبة لتوليد محضر Word، من قاعدة البيانات مباشرة.
 */
async function buildReportData(committeeId: string): Promise<CommitteeReportData | null> {
  const committee = await Committee.findById(committeeId);
  if (!committee) return null;

  const [phase, circle, participants, categories, assignments] = await Promise.all([
    Phase.findById(committee.phaseId),
    committee.circleId ? Circle.findById(committee.circleId) : Promise.resolve(null),
    Participant.find(
      committee.circleId
        ? { phaseId: committee.phaseId, circleId: committee.circleId }
        : { phaseId: committee.phaseId }
    ),
    Category.find(),
    CommitteeCriterionAssignment.find({ committeeId }).populate("criterionId").populate(
      "judgeUserId",
      "-passwordHash"
    ),
  ]);

  const head = committee.headUserId ? await User.findById(committee.headUserId) : null;

  const categoryNameById = new Map(categories.map((c) => [c._id.toString(), c.name]));

  const qualifiedParticipants = participants
    .filter((p) => p.qualified)
    .map((p) => ({
      fullName: p.fullName,
      categoryName: categoryNameById.get(p.categoryId.toString()) || "—",
      municipality: p.municipality,
      age: p.age,
    }));

  const members = [
    ...(head ? [{ fullName: head.fullName, isHead: true }] : []),
    ...assignments
      .filter((a) => !head || a.judgeUserId._id.toString() !== head._id.toString())
      .map((a) => ({
        fullName: (a.judgeUserId as any).fullName,
        isHead: false,
        criterionName: (a.criterionId as any).name,
      })),
  ];

  return {
    committeeName: committee.name,
    phaseName: phase?.name,
    circleName: circle?.name,
    totalParticipants: participants.length,
    qualifiedParticipants,
    members,
  };
}

/**
 * GET /api/admin/committees/:id/report.docx
 * المدير يمكنه توليد محضر Word لأي لجنة.
 */
export async function downloadCommitteeReportAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const data = await buildReportData(id);
  if (!data) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const buffer = await generateCommitteeReport(data);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="report.docx"; filename*=UTF-8''${encodeURIComponent(`محضر-${data.committeeName}.docx`)}`
  );
  res.send(buffer);
}

/**
 * GET /api/head/report.docx
 * رئيس اللجنة يولّد محضر لجنته النشطة فقط.
 */
export async function downloadOwnCommitteeReport(req: AuthRequest, res: Response) {
  const committeeId = req.auth!.activeCommitteeId!;
  const data = await buildReportData(committeeId);
  if (!data) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const buffer = await generateCommitteeReport(data);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="report.docx"; filename*=UTF-8''${encodeURIComponent(`محضر-${data.committeeName}.docx`)}`
  );
  res.send(buffer);
}