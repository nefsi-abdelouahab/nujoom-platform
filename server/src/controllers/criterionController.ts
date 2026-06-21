import { Request, Response } from "express";
import { Criterion } from "../models/Criterion";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";
import { Score } from "../models/Score";

export async function listCriteria(_req: Request, res: Response) {
  const criteria = await Criterion.find();
  res.json(criteria);
}

export async function createCriterion(req: Request, res: Response) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name مطلوب" });
  const criterion = await Criterion.create({ name, indicators: [] });
  res.status(201).json(criterion);
}

export async function updateCriterion(req: Request, res: Response) {
  const { id } = req.params;
  const { name } = req.body;
  const criterion = await Criterion.findByIdAndUpdate(id, { ...(name && { name }) }, { new: true });
  if (!criterion) return res.status(404).json({ error: "المعيار غير موجود" });
  res.json(criterion);
}

/**
 * حذف معيار: يفحص التعيينات المرتبطة + الدرجات المرتبطة (عبر criterionId)
 * مطابقة لمنطق الفرونت إند: deleteCriterion في AppDataContext + التنسيق مع ScoresContext
 * من داخل صفحة /admin/criteria (القسم 13، نقطة 5 في التوثيق).
 */
export async function deleteCriterion(req: Request, res: Response) {
  const { id } = req.params;
  const confirm = req.query.confirm === "true";

  const [relatedAssignments, relatedScores] = await Promise.all([
    CommitteeCriterionAssignment.countDocuments({ criterionId: id }),
    Score.countDocuments({ criterionId: id }),
  ]);

  const criterion = await Criterion.findById(id);
  const indicatorCount = criterion?.indicators.length ?? 0;

  const parts: string[] = [];
  if (indicatorCount > 0) parts.push(`${indicatorCount} مؤشر`);
  if (relatedAssignments > 0) parts.push(`${relatedAssignments} تعيين محكّم`);
  if (relatedScores > 0) parts.push(`${relatedScores} درجة مُدخلة`);

  if (parts.length > 0 && !confirm) {
    return res.json({ success: false, relatedSummary: parts.join(" و ") });
  }

  if (confirm) {
    await CommitteeCriterionAssignment.deleteMany({ criterionId: id });
    await Score.deleteMany({ criterionId: id });
  }

  const deleted = await Criterion.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "المعيار غير موجود" });

  res.json({ success: true });
}

// ---- المؤشرات (Embedded داخل المعيار) ----

export async function addIndicator(req: Request, res: Response) {
  const { criterionId } = req.params;
  const { name, maxScore } = req.body;
  if (!name || maxScore === undefined) {
    return res.status(400).json({ error: "name و maxScore مطلوبان" });
  }

  const criterion = await Criterion.findById(criterionId);
  if (!criterion) return res.status(404).json({ error: "المعيار غير موجود" });

  criterion.indicators.push({ name, maxScore } as any);
  await criterion.save();
  res.status(201).json(criterion);
}

export async function updateIndicator(req: Request, res: Response) {
  const { criterionId, indicatorId } = req.params;
  const { name, maxScore } = req.body;

  const criterion = await Criterion.findById(criterionId);
  if (!criterion) return res.status(404).json({ error: "المعيار غير موجود" });

  const indicator = criterion.indicators.find((i: any) => i._id.toString() === indicatorId);
  if (!indicator) return res.status(404).json({ error: "المؤشر غير موجود" });

  if (name) indicator.name = name;
  if (maxScore !== undefined) indicator.maxScore = maxScore;

  await criterion.save();
  res.json(criterion);
}

// حذف المؤشر غير محمي (يطابق deleteIndicator في AppDataContext — لا يرجع DeleteResult)
export async function deleteIndicator(req: Request, res: Response) {
  const { criterionId, indicatorId } = req.params;

  const criterion = await Criterion.findById(criterionId);
  if (!criterion) return res.status(404).json({ error: "المعيار غير موجود" });

  criterion.indicators = criterion.indicators.filter(
    (i: any) => i._id.toString() !== indicatorId
  ) as any;

  await criterion.save();
  res.json(criterion);
}