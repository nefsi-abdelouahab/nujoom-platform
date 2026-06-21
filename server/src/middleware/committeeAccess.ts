import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

/**
 * يتحقق أن المستخدم (head/judge) لديه activeCommitteeId محدّد في التوكن
 * (تم تحديده عند login مباشرة أو عبر /api/auth/select-committee).
 * يقابل الشرط الثالث في RoleGuard.tsx: head/judge بدون activeCommitteeId → رفض.
 */
export function requireActiveCommittee(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth?.activeCommitteeId) {
    return res.status(400).json({
      error: "لا توجد لجنة نشطة محدّدة — استخدم /api/auth/select-committee أولًا",
    });
  }
  next();
}