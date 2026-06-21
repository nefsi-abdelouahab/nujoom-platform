import {
  Participant,
  Score,
  Criterion,
  Committee,
  CommitteeCriterionAssignment,
  User,
} from "@/types";

// المشاركون الذين يجب على لجنة معيّنة تقييمهم (بنفس مرحلتها ودائرتها)
export function getParticipantsForCommittee(
  committeeId: string,
  committees: Committee[],
  participants: Participant[]
): Participant[] {
  const committee = committees.find((c) => c.id === committeeId);
  if (!committee) return [];

  return participants.filter((p) => {
    const samePhase = p.phaseId === committee.phaseId;
    const sameCircle = committee.circleId ? p.circleId === committee.circleId : true;
    return samePhase && sameCircle;
  });
}

export function getCriterionById(criterionId: string, criteria: Criterion[]) {
  return criteria.find((c) => c.id === criterionId);
}

// إيجاد درجة محكّم معيّن لمشارك معيّن (إن وُجدت)
export function getScoreFor(
  participantId: string,
  committeeId: string,
  criterionId: string,
  judgeUserId: string,
  scores: Score[]
): Score | undefined {
  return scores.find(
    (s) =>
      s.participantId === participantId &&
      s.committeeId === committeeId &&
      s.criterionId === criterionId &&
      s.judgeUserId === judgeUserId
  );
}

// كل تعيينات لجنة معينة: أي معيار يحكّمه أي محكّم (قد يتكرر المعيار لعدة محكّمين)
export function getAssignmentsForCommittee(
  committeeId: string,
  assignments: CommitteeCriterionAssignment[],
  criteria: Criterion[],
  users: User[]
) {
  return assignments
    .filter((a) => a.committeeId === committeeId)
    .map((a) => ({
      ...a,
      criterion: criteria.find((c) => c.id === a.criterionId),
      judge: users.find((u) => u.id === a.judgeUserId),
    }));
}

// نفس البيانات أعلاه لكن مُجمّعة حسب المعيار: كل معيار ← قائمة المحكّمين المسؤولين عنه
export function getAssignmentsGroupedByCriterion(
  committeeId: string,
  assignments: CommitteeCriterionAssignment[],
  criteria: Criterion[],
  users: User[]
) {
  const committeeAssignments = getAssignmentsForCommittee(committeeId, assignments, criteria, users);

  return criteria.map((criterion) => ({
    criterion,
    judges: committeeAssignments
      .filter((a) => a.criterionId === criterion.id)
      .map((a) => ({ assignmentId: a.id, judge: a.judge })),
  }));
}

// حساب المعدل النهائي لمشارك واحد: مجموع (total) لكل معيار ÷ عدد المعايير
export function calculateParticipantAverage(
  participantId: string,
  committeeId: string,
  scores: Score[]
): { average: number; criteriaScores: { criterionId: string; total: number }[] } {
  const relevantScores = scores.filter(
    (s) => s.participantId === participantId && s.committeeId === committeeId
  );

  const criteriaScores = relevantScores.map((s) => ({
    criterionId: s.criterionId,
    total: s.total,
  }));

  if (criteriaScores.length === 0) {
    return { average: 0, criteriaScores: [] };
  }

  const sum = criteriaScores.reduce((acc, c) => acc + c.total, 0);
  const average = sum / criteriaScores.length;

  return { average, criteriaScores };
}

// كم معيار يجب أن يُقيَّم في هذه اللجنة (لمعرفة إن كان التقييم مكتملًا)
// عدد المعايير الفريدة المُغطّاة فعليًا في هذه اللجنة (بمحكّم واحد على الأقل لكل معيار).
// مهم: هذا ليس عدد التعيينات (assignments) — فمعيار واحد قد يكون له أكثر من محكّم
// (لتسريع العمل عند كثرة المشاركين)، وهذا لا يضاعف عدد المعايير التي يُتوقَّع
// أن يُقيَّم بها كل مشارك.
export function getCriteriaCountForCommittee(
  committeeId: string,
  assignments: CommitteeCriterionAssignment[]
): number {
  const uniqueCriteriaIds = new Set(
    assignments.filter((a) => a.committeeId === committeeId).map((a) => a.criterionId)
  );
  return uniqueCriteriaIds.size;
}

// حساب مجموع درجات المؤشرات
export function calculateTotal(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

// حساب العمر بالسنوات من تاريخ الميلاد (ISO date string)
export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
// ترتيب عنصر ضمن قائمة مرتّبة تنازليًا حسب average، مع قاعدة "لا يتم كسر التعادل"
// (المشاركون بنفس المعدل يحصلون على نفس الترتيب)
export function getRankWithTies<T extends { average: number }>(
  sortedList: T[],
  index: number
): number {
  const current = sortedList[index];
  const prevAverage = index > 0 ? sortedList[index - 1].average : null;
  return prevAverage === current.average
    ? sortedList.findIndex((item) => item.average === current.average) + 1
    : index + 1;
}
// تصدير مصفوفة صفوف كملف CSV وتحميله مباشرة في المتصفح (لا يحتاج Backend)
export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csvContent = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  // \uFEFF (BOM) لضمان عرض الحروف العربية بشكل صحيح في Excel
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}