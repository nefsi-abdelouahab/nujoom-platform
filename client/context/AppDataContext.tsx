"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest, normalizeId, normalizeIds, ApiError } from "@/lib/api";
import {
  Phase,
  Category,
  Circle,
  Committee,
  Criterion,
  User,
  CommitteeCriterionAssignment,
  Participant,
} from "@/types";

interface DeleteResult {
  success: boolean;
  relatedSummary?: string;
}

interface AppDataContextType {
  phases: Phase[];
  categories: Category[];
  circles: Circle[];
  committees: Committee[];
  criteria: Criterion[];
  users: User[];
  assignments: CommitteeCriterionAssignment[];
  participants: Participant[];
  isLoading: boolean;

  // المراحل
  addPhase: (name: string) => Promise<void>;
  updatePhase: (id: string, name: string) => Promise<void>;
  deletePhase: (id: string) => Promise<DeleteResult>;
  confirmDeletePhase: (id: string) => Promise<void>;

  // الفئات
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<DeleteResult>;
  confirmDeleteCategory: (id: string) => Promise<void>;

  // الدوائر
  addCircle: (name: string, phaseId: string) => Promise<void>;
  updateCircle: (id: string, name: string, phaseId: string) => Promise<void>;
  deleteCircle: (id: string) => Promise<DeleteResult>;
  confirmDeleteCircle: (id: string) => Promise<void>;

  // اللجان
  addCommittee: (committee: Omit<Committee, "id">) => Promise<void>;
  updateCommittee: (id: string, data: Partial<Committee>) => Promise<void>;
  deleteCommittee: (id: string) => Promise<DeleteResult>;
  confirmDeleteCommittee: (id: string) => Promise<void>;

  // المعايير
  addCriterion: (name: string) => Promise<void>;
  updateCriterion: (id: string, name: string) => Promise<void>;
  deleteCriterion: (id: string) => Promise<DeleteResult>;
  confirmDeleteCriterion: (id: string) => Promise<void>;

  // المؤشرات
  addIndicator: (criterionId: string, name: string, maxScore: number) => Promise<void>;
  updateIndicator: (criterionId: string, indicatorId: string, name: string, maxScore: number) => Promise<void>;
  deleteIndicator: (criterionId: string, indicatorId: string) => Promise<void>;

  // المستخدمون
  addJudge: (judge: Omit<User, "id">) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateJudge: (id: string, data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  deleteJudge: (id: string) => Promise<DeleteResult>;
  confirmDeleteJudge: (id: string) => Promise<void>;

  // التعيينات
  addCommitteeCriterionAssignment: (
    committeeId: string,
    criterionId: string,
    judgeUserId: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAssignment: (id: string) => Promise<void>;
  refreshAssignments: (committeeId: string) => Promise<void>;

  // المشاركون
  addParticipants: (newOnes: Omit<Participant, "id">[]) => Promise<void>;
  updateParticipant: (id: string, data: Partial<Participant>) => Promise<void>;
  deleteParticipant: (id: string) => Promise<void>;
  setParticipantQualified: (participantId: string, qualified: boolean) => Promise<void>;
  advanceQualifiedParticipants: (committeeId: string) => Promise<number>;
  refreshParticipants: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// مساعد: تطبيع المستند مع ضمان أن indicators لها id أيضًا (المؤشرات Embedded في MongoDB تحتوي _id)
function normalizeCriterion(raw: Record<string, unknown>): Criterion {
  // نقوم بتطبيع المعيار الأساسي أولاً
  const normalizedRaw = normalizeId(raw) as any;
  
  // نقوم بتطبيع مصفوفة المؤشرات بشكل آمن إذا كانت موجودة
  const indicators = Array.isArray(normalizedRaw.indicators)
    ? normalizedRaw.indicators.map((ind: any) => normalizeId(ind))
    : [];

  return {
    ...normalizedRaw,
    indicators,
  } as Criterion;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<CommitteeCriterionAssignment[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [
          phasesData,
          categoriesData,
          circlesData,
          committeesData,
          criteriaData,
          usersData,
          participantsData,
        ] = await Promise.all([
          apiRequest<Record<string, unknown>[]>("/admin/phases"),
          apiRequest<Record<string, unknown>[]>("/admin/categories"),
          apiRequest<Record<string, unknown>[]>("/admin/circles"),
          apiRequest<Record<string, unknown>[]>("/admin/committees"),
          apiRequest<Record<string, unknown>[]>("/admin/criteria"),
          apiRequest<Record<string, unknown>[]>("/admin/users"),
          apiRequest<Record<string, unknown>[]>("/admin/participants"),
        ]);

        setPhases(normalizeIds(phasesData) as unknown as Phase[]);
        setCategories(normalizeIds(categoriesData) as unknown as Category[]);
        setCircles(normalizeIds(circlesData) as unknown as Circle[]);
        setCommittees(normalizeIds(committeesData) as unknown as Committee[]);
        setCriteria(criteriaData.map(normalizeCriterion));
        setUsers(normalizeIds(usersData) as unknown as User[]);
        setParticipants(normalizeIds(participantsData) as unknown as Participant[]);

        // التعيينات: نجلبها لكل لجنة دفعة واحدة
        const allAssignments: CommitteeCriterionAssignment[] = [];
        const committeeIds = committeesData.map((c) => String(c._id ?? c.id));
        await Promise.all(
          committeeIds.map(async (cid) => {
            try {
              const asgns = await apiRequest<Record<string, unknown>[]>(
                `/admin/committees/${cid}/assignments`
              );
              allAssignments.push(
                ...(normalizeIds(asgns) as unknown as CommitteeCriterionAssignment[])
              );
            } catch {
              // تجاهل لجنة بدون تعيينات
            }
          })
        );
        setAssignments(allAssignments);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          // مستخدم غير admin — نتركها فاضية بصمت، كل دور يجلب ما يحتاجه بنفسه
          return;
        }
        console.error("فشل تحميل بيانات المسابقة:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAll();
  }, []);

  // ---- المراحل ----
  async function addPhase(name: string) {
    const created = await apiRequest<Record<string, unknown>>("/admin/phases", {
      method: "POST",
      body: { name, type: "qualifiers", order: phases.length + 1 },
    });
    setPhases((prev) => [...prev, normalizeId(created) as unknown as Phase]);
  }

  async function updatePhase(id: string, name: string) {
    const updated = await apiRequest<Record<string, unknown>>(`/admin/phases/${id}`, {
      method: "PUT",
      body: { name },
    });
    setPhases((prev) => prev.map((p) => (p.id === id ? normalizeId(updated) as unknown as Phase : p)));
  }

  async function deletePhase(id: string): Promise<DeleteResult> {
    const result = await apiRequest<DeleteResult>(`/admin/phases/${id}`, { method: "DELETE" });
    if (result.success) setPhases((prev) => prev.filter((p) => p.id !== id));
    return result;
  }

  async function confirmDeletePhase(id: string) {
    await apiRequest(`/admin/phases/${id}?confirm=true`, { method: "DELETE" });
    setPhases((prev) => prev.filter((p) => p.id !== id));
    // نُنظّف الدوائر واللجان المرتبطة من الـ state أيضًا
    setCircles((prev) => prev.filter((c) => c.phaseId !== id));
    setCommittees((prev) => prev.filter((c) => c.phaseId !== id));
    setParticipants((prev) => prev.filter((p) => p.phaseId !== id));
  }

  // ---- الفئات ----
  async function addCategory(name: string) {
    const created = await apiRequest<Record<string, unknown>>("/admin/categories", {
      method: "POST",
      body: { name, order: categories.length + 1 },
    });
    setCategories((prev) => [...prev, normalizeId(created) as unknown as Category]);
  }

  async function updateCategory(id: string, name: string) {
    const updated = await apiRequest<Record<string, unknown>>(`/admin/categories/${id}`, {
      method: "PUT",
      body: { name },
    });
    setCategories((prev) => prev.map((c) => (c.id === id ? normalizeId(updated) as unknown as Category : c)));
  }

  async function deleteCategory(id: string): Promise<DeleteResult> {
    const result = await apiRequest<DeleteResult>(`/admin/categories/${id}`, { method: "DELETE" });
    if (result.success) setCategories((prev) => prev.filter((c) => c.id !== id));
    return result;
  }

  async function confirmDeleteCategory(id: string) {
    await apiRequest(`/admin/categories/${id}?confirm=true`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setParticipants((prev) => prev.filter((p) => p.categoryId !== id));
  }

  // ---- الدوائر ----
  async function addCircle(name: string, phaseId: string) {
    const created = await apiRequest<Record<string, unknown>>("/admin/circles", {
      method: "POST",
      body: { name, phaseId },
    });
    setCircles((prev) => [...prev, normalizeId(created) as unknown as Circle]);
  }

  async function updateCircle(id: string, name: string, phaseId: string) {
    const updated = await apiRequest<Record<string, unknown>>(`/admin/circles/${id}`, {
      method: "PUT",
      body: { name, phaseId },
    });
    setCircles((prev) => prev.map((c) => (c.id === id ? normalizeId(updated) as unknown as Circle : c)));
  }

  async function deleteCircle(id: string): Promise<DeleteResult> {
    const result = await apiRequest<DeleteResult>(`/admin/circles/${id}`, { method: "DELETE" });
    if (result.success) setCircles((prev) => prev.filter((c) => c.id !== id));
    return result;
  }

  async function confirmDeleteCircle(id: string) {
    await apiRequest(`/admin/circles/${id}?confirm=true`, { method: "DELETE" });
    setCircles((prev) => prev.filter((c) => c.id !== id));
    setCommittees((prev) => prev.filter((c) => c.circleId !== id));
    setParticipants((prev) => prev.filter((p) => p.circleId !== id));
  }

  // ---- اللجان ----
  async function addCommittee(committee: Omit<Committee, "id">) {
    const created = await apiRequest<Record<string, unknown>>("/admin/committees", {
      method: "POST",
      body: committee,
    });
    setCommittees((prev) => [...prev, normalizeId(created) as unknown as Committee]);
  }

  async function updateCommittee(id: string, data: Partial<Committee>) {
    const updated = await apiRequest<Record<string, unknown>>(`/admin/committees/${id}`, {
      method: "PUT",
      body: data,
    });
    setCommittees((prev) => prev.map((c) => (c.id === id ? normalizeId(updated) as unknown as Committee : c)));
  }

  async function deleteCommittee(id: string): Promise<DeleteResult> {
    const result = await apiRequest<DeleteResult>(`/admin/committees/${id}`, { method: "DELETE" });
    if (result.success) {
      setCommittees((prev) => prev.filter((c) => c.id !== id));
      setAssignments((prev) => prev.filter((a) => a.committeeId !== id));
    }
    return result;
  }

  async function confirmDeleteCommittee(id: string) {
    await apiRequest(`/admin/committees/${id}?confirm=true`, { method: "DELETE" });
    setCommittees((prev) => prev.filter((c) => c.id !== id));
    setAssignments((prev) => prev.filter((a) => a.committeeId !== id));
  }

  // ---- المعايير ----
  async function addCriterion(name: string) {
    const created = await apiRequest<Record<string, unknown>>("/admin/criteria", {
      method: "POST",
      body: { name },
    });
    setCriteria((prev) => [...prev, normalizeCriterion(created)]);
  }

  async function updateCriterion(id: string, name: string) {
    const updated = await apiRequest<Record<string, unknown>>(`/admin/criteria/${id}`, {
      method: "PUT",
      body: { name },
    });
    setCriteria((prev) => prev.map((c) => (c.id === id ? normalizeCriterion(updated) : c)));
  }

  async function deleteCriterion(id: string): Promise<DeleteResult> {
    const result = await apiRequest<DeleteResult>(`/admin/criteria/${id}`, { method: "DELETE" });
    if (result.success) {
      setCriteria((prev) => prev.filter((c) => c.id !== id));
      setAssignments((prev) => prev.filter((a) => a.criterionId !== id));
    }
    return result;
  }

  async function confirmDeleteCriterion(id: string) {
    await apiRequest(`/admin/criteria/${id}?confirm=true`, { method: "DELETE" });
    setCriteria((prev) => prev.filter((c) => c.id !== id));
    setAssignments((prev) => prev.filter((a) => a.criterionId !== id));
  }

  // ---- المؤشرات ----
  async function addIndicator(criterionId: string, name: string, maxScore: number) {
    const updated = await apiRequest<Record<string, unknown>>(
      `/admin/criteria/${criterionId}/indicators`,
      { method: "POST", body: { name, maxScore } }
    );
    setCriteria((prev) => prev.map((c) => (c.id === criterionId ? normalizeCriterion(updated) : c)));
  }

  async function updateIndicator(criterionId: string, indicatorId: string, name: string, maxScore: number) {
    const updated = await apiRequest<Record<string, unknown>>(
      `/admin/criteria/${criterionId}/indicators/${indicatorId}`,
      { method: "PUT", body: { name, maxScore } }
    );
    setCriteria((prev) => prev.map((c) => (c.id === criterionId ? normalizeCriterion(updated) : c)));
  }

  async function deleteIndicator(criterionId: string, indicatorId: string) {
    const updated = await apiRequest<Record<string, unknown>>(
      `/admin/criteria/${criterionId}/indicators/${indicatorId}`,
      { method: "DELETE" }
    );
    setCriteria((prev) => prev.map((c) => (c.id === criterionId ? normalizeCriterion(updated) : c)));
  }

  // ---- المستخدمون ----
  async function addJudge(
    judge: Omit<User, "id">
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const created = await apiRequest<Record<string, unknown>>("/admin/users", {
        method: "POST",
        body: judge,
      });
      const normalized = normalizeId(created) as unknown as User;
      setUsers((prev) => [...prev, normalized]);
      return { success: true, user: normalized };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      throw err;
    }
  }

  async function updateJudge(
    id: string,
    data: Partial<User>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updated = await apiRequest<Record<string, unknown>>(`/admin/users/${id}`, {
        method: "PUT",
        body: data,
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? normalizeId(updated) as unknown as User : u)));
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      throw err;
    }
  }

  async function deleteJudge(id: string): Promise<DeleteResult> {
    const result = await apiRequest<DeleteResult>(`/admin/users/${id}`, { method: "DELETE" });
    if (result.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setAssignments((prev) => prev.filter((a) => a.judgeUserId !== id));
    }
    return result;
  }

  async function confirmDeleteJudge(id: string) {
    await apiRequest(`/admin/users/${id}?confirm=true`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setAssignments((prev) => prev.filter((a) => a.judgeUserId !== id));
  }

  // ---- التعيينات ----
  async function addCommitteeCriterionAssignment(
    committeeId: string,
    criterionId: string,
    judgeUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const created = await apiRequest<Record<string, unknown>>(
        `/admin/committees/${committeeId}/assignments`,
        { method: "POST", body: { criterionId, judgeUserId } }
      );
      const normalized = normalizeId(created) as unknown as CommitteeCriterionAssignment;
      setAssignments((prev) => [...prev, normalized]);
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) return { success: false, error: err.message };
      throw err;
    }
  }

  async function deleteAssignment(id: string) {
    // نحتاج committeeId لمعرفة endpoint الصحيح
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) return;
    await apiRequest(
      `/admin/committees/${assignment.committeeId}/assignments/${id}`,
      { method: "DELETE" }
    );
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  async function refreshAssignments(committeeId: string) {
    const asgns = await apiRequest<Record<string, unknown>[]>(
      `/admin/committees/${committeeId}/assignments`
    );
    const normalized = normalizeIds(asgns) as unknown as CommitteeCriterionAssignment[];
    setAssignments((prev) => [
      ...prev.filter((a) => a.committeeId !== committeeId),
      ...normalized,
    ]);
  }

  // ---- المشاركون ----
  async function addParticipants(newOnes: Omit<Participant, "id">[]) {
    const created = await apiRequest<Record<string, unknown>[]>("/admin/participants", {
      method: "POST",
      body: newOnes,
    });
    setParticipants((prev) => [
      ...prev,
      ...(normalizeIds(created) as unknown as Participant[]),
    ]);
  }

  async function updateParticipant(id: string, data: Partial<Participant>) {
    const updated = await apiRequest<Record<string, unknown>>(`/admin/participants/${id}`, {
      method: "PUT",
      body: data,
    });
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? normalizeId(updated) as unknown as Participant : p))
    );
  }

  async function deleteParticipant(id: string) {
    await apiRequest(`/admin/participants/${id}`, { method: "DELETE" });
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  async function setParticipantQualified(participantId: string, qualified: boolean) {
    const updated = await apiRequest<Record<string, unknown>>(
      `/head/participants/${participantId}/qualify`,
      { method: "PATCH", body: { qualified } }
    );
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? normalizeId(updated) as unknown as Participant : p
      )
    );
  }

  async function advanceQualifiedParticipants(committeeId: string): Promise<number> {
    const result = await apiRequest<{ advancedCount: number }>(
      `/head/advance-qualified`,
      { method: "POST" }
    );
    if (result.advancedCount > 0) {
      // نُعيد جلب المشاركين لأن نسخًا جديدة أُنشئت في الباك إند
      await refreshParticipants();
    }
    return result.advancedCount;
  }

  async function refreshParticipants() {
    const data = await apiRequest<Record<string, unknown>[]>("/admin/participants");
    setParticipants(normalizeIds(data) as unknown as Participant[]);
  }

  return (
    <AppDataContext.Provider
      value={{
        phases,
        categories,
        circles,
        committees,
        criteria,
        users,
        assignments,
        participants,
        isLoading,
        addPhase, updatePhase, deletePhase, confirmDeletePhase,
        addCategory, updateCategory, deleteCategory, confirmDeleteCategory,
        addCircle, updateCircle, deleteCircle, confirmDeleteCircle,
        addCommittee, updateCommittee, deleteCommittee, confirmDeleteCommittee,
        addCriterion, updateCriterion, deleteCriterion, confirmDeleteCriterion,
        addIndicator, updateIndicator, deleteIndicator,
        addJudge, updateJudge, deleteJudge, confirmDeleteJudge,
        addCommitteeCriterionAssignment, deleteAssignment, refreshAssignments,
        addParticipants, updateParticipant, deleteParticipant,
        setParticipantQualified, advanceQualifiedParticipants, refreshParticipants,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}