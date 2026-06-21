"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { useAppData } from "@/context/AppDataContext";

interface AuthContextType {
  currentUser: User | null;
  activeCommitteeId: string | null;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  selectCommittee: (committeeId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeCommitteeId, setActiveCommitteeId] = useState<string | null>(null);
  const router = useRouter();
  const { users } = useAppData();

  // مشتق دائمًا من القائمة الحالية لـ users، حتى تنعكس أي تعديلات (مثل تغيير الاسم/كلمة المرور) فورًا
  const currentUser = users.find((u) => u.id === currentUserId) || null;

  function login(username: string, password: string) {
    const found = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!found) {
      return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
    }

    setCurrentUserId(found.id);

    // المدير لا لجنة له، ينتقل مباشرة
    if (found.role === "admin") {
      setActiveCommitteeId(null);
      router.push("/admin");
      return { success: true };
    }

    // لجنة واحدة فقط → دخول مباشر
    if (found.committeeIds.length === 1) {
      setActiveCommitteeId(found.committeeIds[0]);
      router.push(found.role === "head" ? "/head" : "/judge");
      return { success: true };
    }

    // أكثر من لجنة → يبقى بدون لجنة محددة حتى يختار (تُعرض شاشة الاختيار)
    setActiveCommitteeId(null);
    return { success: true };
  }

  function selectCommittee(committeeId: string) {
    setActiveCommitteeId(committeeId);
    if (currentUser?.role === "head") {
      router.push("/head");
    } else if (currentUser?.role === "judge") {
      router.push("/judge");
    }
  }

  function logout() {
    setCurrentUserId(null);
    setActiveCommitteeId(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, activeCommitteeId, login, logout, selectCommittee }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}