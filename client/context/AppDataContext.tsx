"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import {
  phases as initialPhases,
  categories as initialCategories,
  circles as initialCircles,
  committees as initialCommittees,
  criteria as initialCriteria,
  users as initialUsers,
  committeeCriterionAssignments as initialAssignments,
  participants as initialParticipants,
} from "@/lib/mock-data";
import {
  Phase,
  Category,
  Circle,
  Committee,
  Criterion,
  User,
  CommitteeCriterionAssignment,
  Participant,
  Indicator,
} from "@/types";

// ---- نتيجة عملية الحذف المحمية ----
export interface DeleteResult {
  success: boolean;
  /** إذا كان هناك بيانات مرتبطة، نُعيد وصفها هنا لعرضها في نافذة التأكيد */
  relatedSummary?: string;
  /** بعد أن يؤكّد المستخدم → يستدعي هذه الدالة لإتمام الحذف الشامل */
  confirm?: () => void;
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

  // ---- المراحل ----
  addPhase: (name: string) => void;
  updatePhase: (id: string, name: string) => void;
  deletePhase: (id: string) => DeleteResult;

  // ---- الفئات ----
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => DeleteResult;

  // ---- الدوائر/المراكز ----
  addCircle: (name: string, phaseId: string) => void;
  updateCircle: (id: string, name: string, phaseId: string) => void;
  deleteCircle: (id: string) => DeleteResult;

  // ---- المعايير والمؤشرات ----
  addCriterion: (name: string) => void;
  updateCriterion: (id: string, name: string) => void;
  deleteCriterion: (id: string) => DeleteResult;
  addIndicator: (criterionId: string, name: string, maxScore: number) => void;
  updateIndicator: (criterionId: string, indicatorId: string, name: string, maxScore: number) => void;
  deleteIndicator: (criterionId: string, indicatorId: string) => void;

  // ---- المشاركون ----
  addParticipants: (newOnes: Participant[]) => void;
  updateParticipant: (id: string, data: Partial<Omit<Participant, "id">>) => void;
  deleteParticipant: (id: string) => DeleteResult;
  setParticipantQualified: (participantId: string, qualified: boolean) => void;
  advanceQualifiedParticipants: (committeeId: string) => number;

  // ---- المحكّمون والتعيينات ----
  addJudge: (judge: Omit<User, "id">) => { success: boolean; error?: string; user?: User };
  updateJudge: (id: string, data: Partial<Omit<User, "id">>) => { success: boolean; error?: string };
  deleteJudge: (id: string) => DeleteResult;
  addCommitteeCriterionAssignment: (committeeId: string, criterionId: string, judgeUserId: string) => { success: boolean; error?: string };
  deleteAssignment: (id: string) => void;

  // ---- اللجان ----
  addCommittee: (committee: Omit<Committee, "id">) => void;
  updateCommittee: (id: string, data: Partial<Omit<Committee, "id">>) => void;
  deleteCommittee: (id: string) => DeleteResult;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [phases, setPhases] = useState<Phase[]>(initialPhases);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [circles, setCircles] = useState<Circle[]>(initialCircles);
  const [committees, setCommittees] = useState<Committee[]>(initialCommittees);
  const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [assignments, setAssignments] = useState<CommitteeCriterionAssignment[]>(initialAssignments);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);

  // ==================== المراحل ====================

  function addPhase(name: string) {
    setPhases((prev) => [
      ...prev,
      { id: `phase-${Date.now()}`, name, type: "qualifiers", order: prev.length + 1 },
    ]);
  }

  function updatePhase(id: string, name: string) {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  function deletePhase(id: string): DeleteResult {
    const relatedCircles = circles.filter((c) => c.phaseId === id);
    const relatedCommittees = committees.filter((c) => c.phaseId === id);
    const relatedParticipants = participants.filter((p) => p.phaseId === id);

    const parts: string[] = [];
    if (relatedCircles.length) parts.push(`${relatedCircles.length} دائرة/مركز`);
    if (relatedCommittees.length) parts.push(`${relatedCommittees.length} لجنة`);
    if (relatedParticipants.length) parts.push(`${relatedParticipants.length} مشارك`);

    const doDelete = () => {
      const committeeIds = relatedCommittees.map((c) => c.id);
      setAssignments((prev) => prev.filter((a) => !committeeIds.includes(a.committeeId)));
      setCommittees((prev) => prev.filter((c) => c.phaseId !== id));
      setCircles((prev) => prev.filter((c) => c.phaseId !== id));
      setParticipants((prev) => prev.filter((p) => p.phaseId !== id));
      setPhases((prev) => prev.filter((p) => p.id !== id));
    };

    if (parts.length > 0) {
      return { success: false, relatedSummary: parts.join(" و "), confirm: doDelete };
    }
    doDelete();
    return { success: true };
  }

  // ==================== الفئات ====================

  function addCategory(name: string) {
    setCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, name, order: prev.length + 1 },
    ]);
  }

  function updateCategory(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  function deleteCategory(id: string): DeleteResult {
    const relatedParticipants = participants.filter((p) => p.categoryId === id);

    const doDelete = () => {
      setParticipants((prev) => prev.filter((p) => p.categoryId !== id));
      setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    if (relatedParticipants.length > 0) {
      return {
        success: false,
        relatedSummary: `${relatedParticipants.length} مشارك`,
        confirm: doDelete,
      };
    }
    doDelete();
    return { success: true };
  }

  // ==================== الدوائر/المراكز ====================

  function addCircle(name: string, phaseId: string) {
    setCircles((prev) => [...prev, { id: `circle-${Date.now()}`, name, phaseId }]);
  }

  function updateCircle(id: string, name: string, phaseId: string) {
    setCircles((prev) => prev.map((c) => (c.id === id ? { ...c, name, phaseId } : c)));
  }

  function deleteCircle(id: string): DeleteResult {
    const relatedCommittees = committees.filter((c) => c.circleId === id);
    const relatedParticipants = participants.filter((p) => p.circleId === id);

    const parts: string[] = [];
    if (relatedCommittees.length) parts.push(`${relatedCommittees.length} لجنة`);
    if (relatedParticipants.length) parts.push(`${relatedParticipants.length} مشارك`);

    const doDelete = () => {
      const committeeIds = relatedCommittees.map((c) => c.id);
      setAssignments((prev) => prev.filter((a) => !committeeIds.includes(a.committeeId)));
      setCommittees((prev) => prev.filter((c) => c.circleId !== id));
      setParticipants((prev) => prev.filter((p) => p.circleId !== id));
      setCircles((prev) => prev.filter((c) => c.id !== id));
    };

    if (parts.length > 0) {
      return { success: false, relatedSummary: parts.join(" و "), confirm: doDelete };
    }
    doDelete();
    return { success: true };
  }

  // ==================== المعايير ====================

  function addCriterion(name: string) {
    setCriteria((prev) => [
      ...prev,
      { id: `criterion-${Date.now()}`, name, indicators: [] },
    ]);
  }

  function updateCriterion(id: string, name: string) {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  function deleteCriterion(id: string): DeleteResult {
    const relatedAssignments = assignments.filter((a) => a.criterionId === id);
    const criterion = criteria.find((c) => c.id === id);
    const indicatorCount = criterion?.indicators.length ?? 0;

    const parts: string[] = [];
    if (indicatorCount > 0) parts.push(`${indicatorCount} مؤشر`);
    if (relatedAssignments.length) parts.push(`${relatedAssignments.length} تعيين محكّم`);

    const doDelete = () => {
      setAssignments((prev) => prev.filter((a) => a.criterionId !== id));
      setCriteria((prev) => prev.filter((c) => c.id !== id));
    };

    if (parts.length > 0) {
      return { success: false, relatedSummary: parts.join(" و "), confirm: doDelete };
    }
    doDelete();
    return { success: true };
  }

  function addIndicator(criterionId: string, name: string, maxScore: number) {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId
          ? {
              ...c,
              indicators: [
                ...c.indicators,
                { id: `ind-${Date.now()}`, name, maxScore } as Indicator,
              ],
            }
          : c
      )
    );
  }

  function updateIndicator(criterionId: string, indicatorId: string, name: string, maxScore: number) {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId
          ? {
              ...c,
              indicators: c.indicators.map((ind) =>
                ind.id === indicatorId ? { ...ind, name, maxScore } : ind
              ),
            }
          : c
      )
    );
  }

  function deleteIndicator(criterionId: string, indicatorId: string) {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === criterionId
          ? { ...c, indicators: c.indicators.filter((ind) => ind.id !== indicatorId) }
          : c
      )
    );
  }

  // ==================== المشاركون ====================

  function addParticipants(newOnes: Participant[]) {
    setParticipants((prev) => [...prev, ...newOnes]);
  }

  function updateParticipant(id: string, data: Partial<Omit<Participant, "id">>) {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }

  function deleteParticipant(id: string): DeleteResult {
    const doDelete = () => setParticipants((prev) => prev.filter((p) => p.id !== id));
    doDelete();
    return { success: true };
  }

  function setParticipantQualified(participantId: string, qualified: boolean) {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, qualified } : p))
    );
  }

  function advanceQualifiedParticipants(committeeId: string): number {
    const committee = committees.find((c) => c.id === committeeId);
    if (!committee) return 0;

    const currentPhase = phases.find((ph) => ph.id === committee.phaseId);
    const nextPhase = currentPhase
      ? phases.find((ph) => ph.order === currentPhase.order + 1)
      : undefined;
    if (!nextPhase) return 0;

    const eligible = participants.filter(
      (p) =>
        p.qualified &&
        !p.advanced &&
        p.phaseId === committee.phaseId &&
        (committee.circleId ? p.circleId === committee.circleId : true)
    );

    if (eligible.length === 0) return 0;

    const eligibleIds = new Set(eligible.map((p) => p.id));
    const newOnes: Participant[] = eligible.map((p) => ({
      ...p,
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phaseId: nextPhase.id,
      qualified: false,
      advanced: false,
      qualifiedFromParticipantId: p.id,
    }));

    setParticipants((prev) => [
      ...prev.map((p) => (eligibleIds.has(p.id) ? { ...p, advanced: true } : p)),
      ...newOnes,
    ]);

    return eligible.length;
  }

  // ==================== المحكّمون ====================

  function addJudge(judge: Omit<User, "id">): { success: boolean; error?: string; user?: User } {
    const usernameTaken = users.some((u) => u.username === judge.username);
    if (usernameTaken) {
      return { success: false, error: "اسم المستخدم هذا مُستخدم بالفعل" };
    }
    const newUser: User = {
      ...judge,
      id: `user-judge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true, user: newUser };
  }

  function updateJudge(id: string, data: Partial<Omit<User, "id">>): { success: boolean; error?: string } {
    if (data.username) {
      const usernameTaken = users.some((u) => u.username === data.username && u.id !== id);
      if (usernameTaken) return { success: false, error: "اسم المستخدم هذا مُستخدم بالفعل" };
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
    return { success: true };
  }

  function deleteJudge(id: string): DeleteResult {
    const relatedAssignments = assignments.filter((a) => a.judgeUserId === id);
    const relatedCommittees = committees.filter((c) => c.headUserId === id);

    const parts: string[] = [];
    if (relatedAssignments.length) parts.push(`${relatedAssignments.length} تعيين معيار`);
    if (relatedCommittees.length) parts.push(`${relatedCommittees.length} لجنة (رئاسة)`);

    const doDelete = () => {
      setAssignments((prev) => prev.filter((a) => a.judgeUserId !== id));
      setCommittees((prev) =>
        prev.map((c) => (c.headUserId === id ? { ...c, headUserId: undefined } : c))
      );
      setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    if (parts.length > 0) {
      return { success: false, relatedSummary: parts.join(" و "), confirm: doDelete };
    }
    doDelete();
    return { success: true };
  }

  function addCommitteeCriterionAssignment(
    committeeId: string,
    criterionId: string,
    judgeUserId: string
  ): { success: boolean; error?: string } {
    // ملاحظة: يُسمح بتعيين أكثر من محكّم لنفس المعيار في نفس اللجنة
    // (لتسريع التحكيم عند وجود عدد كبير من المشاركين). كل محكّم يرى كل
    // مشاركي اللجنة ويبحث بالاسم عن من يخصّه فعليًا، فلا تعارض في البيانات.
    // القيد الوحيد المطلوب: نفس المحكّم لا يُسند له نفس المعيار مرتين.
    const sameJudgeSameCriterion = assignments.some(
      (a) =>
        a.committeeId === committeeId &&
        a.criterionId === criterionId &&
        a.judgeUserId === judgeUserId
    );
    if (sameJudgeSameCriterion) {
      return { success: false, error: "هذا المحكّم مُعيَّن بالفعل على هذا المعيار في هذه اللجنة" };
    }
    setAssignments((prev) => [
      ...prev,
      {
        id: `assign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        committeeId,
        criterionId,
        judgeUserId,
      },
    ]);
    return { success: true };
  }

  function deleteAssignment(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  // ==================== اللجان ====================

  function addCommittee(committee: Omit<Committee, "id">) {
    setCommittees((prev) => [
      ...prev,
      { ...committee, id: `committee-${Date.now()}` },
    ]);
  }

  function updateCommittee(id: string, data: Partial<Omit<Committee, "id">>) {
    setCommittees((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }

  function deleteCommittee(id: string): DeleteResult {
    const relatedAssignments = assignments.filter((a) => a.committeeId === id);
    const relatedParticipants = participants.filter(
      (p) => committees.find((c) => c.id === id)?.circleId === p.circleId
    );

    const parts: string[] = [];
    if (relatedAssignments.length) parts.push(`${relatedAssignments.length} تعيين محكّم`);
    if (relatedParticipants.length) parts.push(`${relatedParticipants.length} مشارك مرتبط`);

    const doDelete = () => {
      setAssignments((prev) => prev.filter((a) => a.committeeId !== id));
      setCommittees((prev) => prev.filter((c) => c.id !== id));
    };

    if (parts.length > 0) {
      return { success: false, relatedSummary: parts.join(" و "), confirm: doDelete };
    }
    doDelete();
    return { success: true };
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
        addPhase,
        updatePhase,
        deletePhase,
        addCategory,
        updateCategory,
        deleteCategory,
        addCircle,
        updateCircle,
        deleteCircle,
        addCriterion,
        updateCriterion,
        deleteCriterion,
        addIndicator,
        updateIndicator,
        deleteIndicator,
        addParticipants,
        updateParticipant,
        deleteParticipant,
        setParticipantQualified,
        advanceQualifiedParticipants,
        addJudge,
        updateJudge,
        deleteJudge,
        addCommitteeCriterionAssignment,
        deleteAssignment,
        addCommittee,
        updateCommittee,
        deleteCommittee,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}