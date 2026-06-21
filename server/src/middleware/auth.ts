import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { UserRole } from "../models/User";

// نوسّع نوع Request لإضافة بيانات المستخدم المُستخرجة من التوكن
export interface AuthRequest extends Request {
  auth?: JwtPayload;
}

/**
 * Middleware المصادقة: يتحقق من وجود وصلاحية JWT في رأس Authorization.
 * يرفض بـ 401 إن كان غائبًا أو غير صالح أو منتهي الصلاحية.
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "التوكن غير موجود" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyToken(token);
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "التوكن غير صالح أو منتهي الصلاحية" });
  }
}

/**
 * Middleware التفويض: يقيّد المسار بدور (أو أدوار) معيّنة.
 * يُستخدم بعد authenticate دائمًا.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "غير مُصادَق عليه" });
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: "لا تملك صلاحية الوصول لهذا المسار" });
    }
    next();
  };
}

/**
 * يتحقق أن المستخدم المُصادَق له ينتمي لِلجنة معيّنة (committeeId في الـ params أو body).
 * يُستخدم لمسارات head/judge المرتبطة بلجنة محددة.
 */
export function requireCommitteeAccess(getCommitteeId: (req: Request) => string | undefined) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const committeeId = getCommitteeId(req);
    if (!committeeId) {
      return res.status(400).json({ error: "committeeId مطلوب" });
    }
    // الفحص الكامل (مطابقة committeeIds الفعلية للمستخدم) يتم في طبقة الكونترولر
    // لأنه يحتاج قراءة من قاعدة البيانات؛ هنا فقط نمرّر committeeId للخطوة التالية.
    (req as AuthRequest & { committeeId?: string }).committeeId = committeeId;
    next();
  };
}