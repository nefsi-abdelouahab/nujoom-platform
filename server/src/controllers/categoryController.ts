import { Request, Response } from "express";
import { Category } from "../models/Category";
import { Participant } from "../models/Participant";

export async function listCategories(_req: Request, res: Response) {
  const categories = await Category.find().sort({ order: 1 });
  res.json(categories);
}

export async function createCategory(req: Request, res: Response) {
  const { name, order } = req.body;
  if (!name) return res.status(400).json({ error: "name مطلوب" });
  const lastOrder = order ?? (await Category.countDocuments()) + 1;
  const category = await Category.create({ name, order: lastOrder });
  res.status(201).json(category);
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name, order } = req.body;
  const category = await Category.findByIdAndUpdate(
    id,
    { ...(name && { name }), ...(order !== undefined && { order }) },
    { new: true }
  );
  if (!category) return res.status(404).json({ error: "الفئة غير موجودة" });
  res.json(category);
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  const confirm = req.query.confirm === "true";

  const relatedParticipants = await Participant.countDocuments({ categoryId: id });

  if (relatedParticipants > 0 && !confirm) {
    return res.json({ success: false, relatedSummary: `${relatedParticipants} مشارك` });
  }

  if (relatedParticipants > 0 && confirm) {
    await Participant.deleteMany({ categoryId: id });
  }

  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "الفئة غير موجودة" });

  res.json({ success: true });
}