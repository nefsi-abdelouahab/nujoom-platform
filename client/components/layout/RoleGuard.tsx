"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

const HOME_BY_ROLE: Record<UserRole, string> = {
  admin: "/admin",
  head: "/head",
  judge: "/judge",
};

/**
 * يحمي مسارات لوحة تحكم معيّنة (admin/head/judge):
 * - يوجّه لصفحة تسجيل الدخول إن لم يكن هناك مستخدم مسجَّل دخوله.
 * - يوجّه المستخدم إلى لوحته الصحيحة إن حاول دخول مسار دور لا يخصّه.
 * - يوجّه لصفحة تسجيل الدخول إن كان (head/judge) ولم يحدّد لجنته النشطة بعد
 *   (مثلاً بعد تحديث الصفحة، لأن الحالة في الذاكرة فقط ولا تُحفظ).
 */
export default function RoleGuard({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { currentUser, activeCommitteeId } = useAuth();
  const router = useRouter();

  const isAuthorized =
    !!currentUser &&
    currentUser.role === role &&
    (role === "admin" || !!activeCommitteeId);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== role) {
      router.replace(HOME_BY_ROLE[currentUser.role]);
      return;
    }

    if (role !== "admin" && !activeCommitteeId) {
      router.replace("/login");
    }
  }, [currentUser, activeCommitteeId, role, router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <p className="text-sm text-neutral-500">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  return <>{children}</>;
}
