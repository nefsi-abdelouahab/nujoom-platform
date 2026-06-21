import { Request, Response } from "express";
import { Participant } from "../models/Participant";
import { Committee } from "../models/Committee";
import { Phase } from "../models/Phase";
import { Score } from "../models/Score";
import { calculateAge } from "../utils/businessLogic";

export async function listParticipants(req: Request, res: Response) {
  const { phaseId, circleId, categoryId, search } = req.query;
  const filter: Record<string, unknown> = {};
  if (phaseId) filter.phaseId = phaseId;
  if (circleId) filter.circleId = circleId;
  if (categoryId) filter.categoryId = categoryId;
  if (search) filter.fullName = { $regex: search, $options: "i" };

  const participants = await Participant.find(filter);
  res.json(participants);
}

/**
 * إضافة مشاركين (واحد أو دفعة عبر CSV) — يقابل addParticipants في AppDataContext.
 * يحسب العمر تلقائيًا من birthDate إن لم يُرسَل.
 */
export async function createParticipants(req: Request, res: Response) {
  const items = Array.isArray(req.body) ? req.body : [req.body];

  const docs = items.map((p) => {
    const birthDate = new Date(p.birthDate);
    return {
      fullName: p.fullName,
      birthDate,
      age: p.age ?? calculateAge(birthDate),
      categoryId: p.categoryId,
      circleId: p.circleId,
      municipality: p.municipality,
      phaseId: p.phaseId,
      qualified: false,
      advanced: false,
    };
  });

  const created = await Participant.insertMany(docs);
  res.status(201).json(created);
}

export async function updateParticipant(req: Request, res: Response) {
  const { id } = req.params;
  const data = { ...req.body };
  if (data.birthDate) {
    data.birthDate = new Date(data.birthDate);
    if (data.age === undefined) data.age = calculateAge(data.birthDate);
  }
  const participant = await Participant.findByIdAndUpdate(id, data, { new: true });
  if (!participant) return res.status(404).json({ error: "المشارك غير موجود" });
  res.json(participant);
}

/**
 * حذف مشارك — يحذف الدرجات المرتبطة به أيضًا
 * (يقابل التنسيق بين AppDataContext و ScoresContext من داخل صفحة /admin/participants).
 */
export async function deleteParticipant(req: Request, res: Response) {
  const { id } = req.params;
  await Score.deleteMany({ participantId: id });
  const deleted = await Participant.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "المشارك غير موجود" });
  res.json({ success: true });
}

/**
 * POST /api/committees/:id/advance-qualified
 * يقابل advanceQualifiedParticipants في AppDataContext تمامًا (القسم 10 في التوثيق):
 * - ينشئ نسخة جديدة من كل مشارك متأهل (id جديد كليًا، عبر insertMany).
 * - المشارك الأصلي يبقى محفوظًا بسجله التاريخي الكامل، فقط advanced يصبح true.
 * - النسخة الجديدة: phaseId = المرحلة التالية، qualified=false، advanced=false،
 *   qualifiedFromParticipantId = id الأصلي.
 * - لا تكرار: يستثني من هم advanced=true مسبقًا.
 * - إن لم توجد مرحلة تالية (اللجنة في "النهائي") → يُعاد 0 دون أي تعديل.
 */
export async function advanceQualifiedParticipants(req: Request, res: Response) {
  const { id: committeeId } = req.params;

  const committee = await Committee.findById(committeeId);
  if (!committee) return res.status(404).json({ error: "اللجنة غير موجودة" });

  const currentPhase = await Phase.findById(committee.phaseId);
  if (!currentPhase) return res.status(404).json({ error: "المرحلة غير موجودة" });

  const nextPhase = await Phase.findOne({ order: currentPhase.order + 1 });
  if (!nextPhase) {
    return res.json({ advancedCount: 0, message: "هذه هي المرحلة الأخيرة — لا توجد مرحلة تالية" });
  }

  const eligibleFilter: Record<string, unknown> = {
    qualified: true,
    advanced: { $ne: true },
    phaseId: committee.phaseId,
  };
  if (committee.circleId) eligibleFilter.circleId = committee.circleId;

  const eligible = await Participant.find(eligibleFilter);
  if (eligible.length === 0) {
    return res.json({ advancedCount: 0 });
  }

  const newDocs = eligible.map((p) => ({
    fullName: p.fullName,
    birthDate: p.birthDate,
    age: p.age,
    categoryId: p.categoryId,
    circleId: p.circleId,
    municipality: p.municipality,
    phaseId: nextPhase._id,
    qualified: false,
    advanced: false,
    qualifiedFromParticipantId: p._id,
  }));

  await Participant.insertMany(newDocs);
  await Participant.updateMany(
    { _id: { $in: eligible.map((p) => p._id) } },
    { $set: { advanced: true } }
  );

  res.json({ advancedCount: eligible.length });
}