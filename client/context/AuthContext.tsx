"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  setToken,
  clearToken,
  getToken,
  ApiError,
} from "@/lib/api";

interface CurrentUser {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "head" | "judge";
  committeeIds?: string[];
  criterionId?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  requiresCommitteeSelection?: boolean;
  committeeIds?: string[];
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  activeCommitteeId: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  selectCommittee: (
    committeeId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeCommitteeId, setActiveCommitteeId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // عند تحميل التطبيق: إن وُجد توكن محفوظ في localStorage، نحاول استرجاع الجلسة
  // تلقائيًا عبر /api/me — هذا يحل قيد "فقدان الجلسة عند Refresh" الذي كان موجودًا
  // في نسخة Mock Data السابقة.
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await apiRequest<
          CurrentUser & { activeCommitteeId?: string }
        >("/auth/me");
        setCurrentUser(me);
        setActiveCommitteeId(me.activeCommitteeId || null);
      } catch {
        // التوكن غير صالح أو منتهي الصلاحية
        clearToken();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(
    username: string,
    password: string,
  ): Promise<LoginResult> {
    try {
      const result = await apiRequest<{
        token: string;
        user: CurrentUser;
        requiresCommitteeSelection: boolean;
        activeCommitteeId?: string;
        committeeIds?: string[];
      }>("/auth/login", {
        method: "POST",
        body: { username, password },
        skipAuth: true,
      });

      setToken(result.token);
      setCurrentUser(result.user);

      if (result.requiresCommitteeSelection) {
        // أكثر من لجنة → لا نحدد activeCommitteeId، الواجهة تعرض شاشة الاختيار
        return {
          success: true,
          requiresCommitteeSelection: true,
          committeeIds: result.committeeIds,
        };
      }

      setActiveCommitteeId(result.activeCommitteeId || null);

      // التحويل لمساره الصحيح حسب الدور
      if (result.user.role === "admin") {
        router.push("/admin");
      } else if (result.user.role === "head") {
        router.push("/head");
      } else {
        router.push("/judge");
      }

      return { success: true };
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "حدث خطأ غير متوقع";
      return { success: false, error: message };
    }
  }

  async function selectCommittee(committeeId: string) {
    try {
      const result = await apiRequest<{
        token: string;
        activeCommitteeId: string;
      }>("/auth/select-committee", { method: "POST", body: { committeeId } });

      setToken(result.token);
      setActiveCommitteeId(result.activeCommitteeId);

      if (currentUser?.role === "head") {
        router.push("/head");
      } else if (currentUser?.role === "judge") {
        router.push("/judge");
      }

      return { success: true };
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "حدث خطأ غير متوقع";
      return { success: false, error: message };
    }
  }

  function logout() {
    clearToken();
    setCurrentUser(null);
    setActiveCommitteeId(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeCommitteeId,
        isLoading,
        login,
        logout,
        selectCommittee,
      }}
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
