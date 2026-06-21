import { Request, Response } from "express";
import { Phase } from "../models/Phase";
import { Circle } from "../models/Circle";
import { Committee } from "../models/Committee";
import { Participant } from "../models/Participant";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";

export async function listPhases(_req: Request, res: Response) {
  const phases = await Phase.find().sort({ order: 1 });
  res.json(phases);
}

export async function createPhase(req: Request, res: Response) {
  const { name, type, order } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "name و type مطلوبان" });
  }
  const lastOrder = order ?? (await Phase.countDocuments()) + 1;
  const phase = await Phase.create({ name, type, order: lastOrder });
  res.status(201).json(phase);
}

export async function updatePhase(req: Request, res: Response) {
  const { id } = req.params;
  const { name, type, order } = req.body;
  const phase = await Phase.findByIdAndUpdate(
    id,
    { ...(name && { name }), ...(type && { type }), ...(order !== undefined && { order }) },
    { new: true }
  );
  if (!phase) return res.status(404).json({ error: "المرحلة غير موجودة" });
  res.json(phase);
}

/**
 * يقابل deletePhase في AppDataContext.tsx تمامًا — نمط الحذف المحمي:
 * إن وُجدت بيانات مرتبطة (دوائر/لجان/مشاركون)، يُعاد ملخص ولا يُحذف
 * إلا بطلب صريح بـ ?confirm=true.
 */
export async function deletePhase(req: Request, res: Response) {
  const { id } = req.params;
  const confirm = req.query.confirm === "true";

  const [relatedCircles, relatedCommittees, relatedParticipants] = await Promise.all([
    Circle.countDocuments({ phaseId: id }),
    Committee.countDocuments({ phaseId: id }),
    Participant.countDocuments({ phaseId: id }),
  ]);

  const parts: string[] = [];
  if (relatedCircles) parts.push(`${relatedCircles} دائرة/مركز`);
  if (relatedCommittees) parts.push(`${relatedCommittees} لجنة`);
  if (relatedParticipants) parts.push(`${relatedParticipants} مشارك`);

  if (parts.length > 0 && !confirm) {
    return res.json({ success: false, relatedSummary: parts.join(" و ") });
  }

  if (parts.length > 0 && confirm) {
    const committeeIds = await Committee.find({ phaseId: id }).distinct("_id");
    await CommitteeCriterionAssignment.deleteMany({ committeeId: { $in: committeeIds } });
    await Committee.deleteMany({ phaseId: id });
    await Circle.deleteMany({ phaseId: id });
    await Participant.deleteMany({ phaseId: id });
  }

  const deleted = await Phase.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "المرحلة غير موجودة" });

  res.json({ success: true });
}