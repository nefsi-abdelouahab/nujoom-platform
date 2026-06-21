import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth";

/**
 * POST /api/auth/bootstrap-admin
 * ينشئ أول مستخدم Admin في النظام — يعمل فقط إذا لم يوجد أي admin مسبقًا.
 * بعد إنشاء أول admin، يرفض هذا المسار العمل تلقائيًا (حماية ذاتية مؤقتة).
 */
export async function bootstrapAdmin(req: Request, res: Response) {
  const { username, password, fullName } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ error: "username و password و fullName مطلوبة" });
  }

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    return res.status(403).json({
      error: "يوجد Admin مسبقًا في النظام — هذا المسار مخصص لإنشاء أول Admin فقط",
    });
  }

  const usernameTaken = await User.findOne({ username });
  if (usernameTaken) {
    return res.status(409).json({ error: "اسم المستخدم هذا مُستخدم بالفعل" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await User.create({
    username,
    passwordHash,
    fullName,
    role: "admin",
    committeeIds: [],
  });

  return res.status(201).json({
    id: admin._id,
    username: admin.username,
    fullName: admin.fullName,
    role: admin.role,
  });
}

/**
 * POST /api/auth/login
 * يقابل منطق login في AuthContext.tsx الحالي تمامًا:
 * - admin → بدون لجنة، دخول مباشر.
 * - لجنة واحدة → activeCommitteeId محدّد تلقائيًا في التوكن.
 * - أكثر من لجنة → committeeIds تُعاد للعميل لعرض شاشة الاختيار، بدون activeCommitteeId في التوكن.
 */
export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username و password مطلوبان" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  const committeeIds = user.committeeIds.map((id) => id.toString());

  // admin: بدون لجان أصلًا
  if (user.role === "admin") {
    const token = signToken({ userId: user._id.toString(), role: user.role });
    return res.json({
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role },
      requiresCommitteeSelection: false,
    });
  }

  // لجنة واحدة فقط → activeCommitteeId محدّد تلقائيًا في التوكن
  if (committeeIds.length === 1) {
    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      activeCommitteeId: committeeIds[0],
    });
    return res.json({
      token,
      user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role },
      requiresCommitteeSelection: false,
      activeCommitteeId: committeeIds[0],
    });
  }

  // أكثر من لجنة → بدون activeCommitteeId، العميل يعرض شاشة الاختيار
  const token = signToken({ userId: user._id.toString(), role: user.role });
  return res.json({
    token,
    user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role },
    requiresCommitteeSelection: true,
    committeeIds,
  });
}

/**
 * POST /api/auth/select-committee
 * يقابل selectCommittee في AuthContext.tsx — يُصدر توكن جديد بـ activeCommitteeId محدّد.
 */
export async function selectCommittee(req: AuthRequest, res: Response) {
  const { committeeId } = req.body;
  if (!req.auth) return res.status(401).json({ error: "غير مُصادَق عليه" });
  if (!committeeId) return res.status(400).json({ error: "committeeId مطلوب" });

  const user = await User.findById(req.auth.userId);
  if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

  const hasCommittee = user.committeeIds.some((id) => id.toString() === committeeId);
  if (!hasCommittee) {
    return res.status(403).json({ error: "هذا المستخدم لا ينتمي لهذه اللجنة" });
  }

  const token = signToken({ userId: user._id.toString(), role: user.role, activeCommitteeId: committeeId });
  return res.json({ token, activeCommitteeId: committeeId });
}

/**
 * GET /api/me
 * يقابل currentUser الحالي — بيانات المستخدم المسجَّل من التوكن.
 */
export async function getMe(req: AuthRequest, res: Response) {
  if (!req.auth) return res.status(401).json({ error: "غير مُصادَق عليه" });

  const user = await User.findById(req.auth.userId).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

  return res.json({
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    committeeIds: user.committeeIds,
    criterionId: user.criterionId,
    activeCommitteeId: req.auth.activeCommitteeId,
  });
}