import { Request, Response } from "express";
import { Circle } from "../models/Circle";
import { Committee } from "../models/Committee";
import { Participant } from "../models/Participant";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";

export async function listCircles(_req: Request, res: Response) {
  const circles = await Circle.find();
  res.json(circles);
}

export async function createCircle(req: Request, res: Response) {
  const { name, phaseId } = req.body;
  if (!name || !phaseId) return res.status(400).json({ error: "name و phaseId مطلوبان" });
  const circle = await Circle.create({ name, phaseId });
  res.status(201).json(circle);
}

export async function updateCircle(req: Request, res: Response) {
  const { id } = req.params;
  const { name, phaseId } = req.body;
  const circle = await Circle.findByIdAndUpdate(
    id,
    { ...(name && { name }), ...(phaseId && { phaseId }) },
    { new: true }
  );
  if (!circle) return res.status(404).json({ error: "الدائرة غير موجودة" });
  res.json(circle);
}

export async function deleteCircle(req: Request, res: Response) {
  const { id } = req.params;
  const confirm = req.query.confirm === "true";

  const [relatedCommittees, relatedParticipants] = await Promise.all([
    Committee.countDocuments({ circleId: id }),
    Participant.countDocuments({ circleId: id }),
  ]);

  const parts: string[] = [];
  if (relatedCommittees) parts.push(`${relatedCommittees} لجنة`);
  if (relatedParticipants) parts.push(`${relatedParticipants} مشارك`);

  if (parts.length > 0 && !confirm) {
    return res.json({ success: false, relatedSummary: parts.join(" و ") });
  }

  if (parts.length > 0 && confirm) {
    const committeeIds = await Committee.find({ circleId: id }).distinct("_id");
    await CommitteeCriterionAssignment.deleteMany({ committeeId: { $in: committeeIds } });
    await Committee.deleteMany({ circleId: id });
    await Participant.deleteMany({ circleId: id });
  }

  const deleted = await Circle.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "الدائرة غير موجودة" });

  res.json({ success: true });
}