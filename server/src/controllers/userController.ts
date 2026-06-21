import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Committee } from "../models/Committee";
import { CommitteeCriterionAssignment } from "../models/CommitteeCriterionAssignment";

// عرض كل المستخدمين (admin فقط) — بدون passwordHash أبدًا
export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().select("-passwordHash");
  res.json(users);
}

/**
 * إضافة محكّم جديد — يقابل addJudge في AppDataContext:
 * يتحقق من عدم تكرار username، يُشفّر كلمة المرور قبل التخزين.
 */
export async function addJudge(req: Request, res: Response) {
  const { username, password, fullName, role, committeeIds, criterionId } = req.body;

  if (!username || !password || !fullName || !role) {
    return res.status(400).json({ error: "username و password و fullName و role مطلوبة" });
  }

  const usernameTaken = await User.findOne({ username });
  if (usernameTaken) {
    return res.status(409).json({ error: "اسم المستخدم هذا مُستخدم بالفعل" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    passwordHash,
    fullName,
    role,
    committeeIds: committeeIds || [],
    criterionId,
  });

  const { passwordHash: _omit, ...safeUser } = user.toObject();
  res.status(201).json(safeUser);
}

/**
 * تحديث بيانات أي مستخدم (admin/head/judge) — يقابل updateJudge في AppDataContext
 * (المستخدمة أيضًا لتحديث حساب المدير نفسه من /admin/settings).
 */
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { username, password, fullName, committeeIds, criterionId } = req.body;

  if (username) {
    const usernameTaken = await User.findOne({ username, _id: { $ne: id } });
    if (usernameTaken) {
      return res.status(409).json({ error: "اسم المستخدم هذا مُستخدم بالفعل" });
    }
  }

  const updateData: Record<string, unknown> = {
    ...(username && { username }),
    ...(fullName && { fullName }),
    ...(committeeIds !== undefined && { committeeIds }),
    ...(criterionId !== undefined && { criterionId }),
  };

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

  res.json(user);
}

/**
 * حذف مستخدم — يفحص التعيينات المرتبطة + رئاسة اللجان
 * (يقابل deleteJudge في AppDataContext).
 */
export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const confirm = req.query.confirm === "true";

  const [relatedAssignments, relatedCommittees] = await Promise.all([
    CommitteeCriterionAssignment.countDocuments({ judgeUserId: id }),
    Committee.countDocuments({ headUserId: id }),
  ]);

  const parts: string[] = [];
  if (relatedAssignments) parts.push(`${relatedAssignments} تعيين معيار`);
  if (relatedCommittees) parts.push(`${relatedCommittees} لجنة (رئاسة)`);

  if (parts.length > 0 && !confirm) {
    return res.json({ success: false, relatedSummary: parts.join(" و ") });
  }

  if (confirm) {
    await CommitteeCriterionAssignment.deleteMany({ judgeUserId: id });
    await Committee.updateMany({ headUserId: id }, { $unset: { headUserId: "" } });
  }

  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "المستخدم غير موجود" });

  res.json({ success: true });
}