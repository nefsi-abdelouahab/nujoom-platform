// ============================================
// أنواع منصة إدارة وتحكيم مسابقة نجوم القراءة
// ============================================

// ---------- المستخدمون والأدوار ----------

export type UserRole = "admin" | "head" | "judge";

export interface User {
  id: string;
  username: string;
  password: string; // mock فقط، لن يُستخدم هكذا في نظام حقيقي
  fullName: string;
  role: UserRole;
  committeeIds: string[]; // قد يكون له أكثر من لجنة (محكّم/رئيس لجنة)
  criterionId?: string; // المعيار المخصص له (للمحكّم ورئيس اللجنة)
}

// ---------- المراحل ----------

export type PhaseType = "qualifiers" | "semifinal" | "final";

export interface Phase {
  id: string;
  name: string; // "التصفيات" | "نصف النهائي" | "النهائي"
  type: PhaseType;
  order: number; // 1, 2, 3
}

// ---------- الفئات العمرية ----------

export interface Category {
  id: string;
  name: string; // "الأطفال" | "اليافعون" | "الشباب"
  order: number;
}

// ---------- الدوائر (تصفيات) والمراكز (نصف نهائي/نهائي) ----------

export interface Circle {
  id: string;
  name: string;
  phaseId: string; // ترتبط بمرحلة التصفيات فقط عادة
}

// ---------- اللجان ----------

export interface Committee {
  id: string;
  name: string; // مثال: "لجنة دائرة الشرق" أو "لجنة نصف النهائي"
  phaseId: string;
  circleId?: string; // موجودة فقط للجان التصفيات
  headUserId?: string; // رئيس اللجنة
}

// ---------- المعايير والمؤشرات ----------

export interface Indicator {
  id: string;
  name: string; // مثال: "طرح موضوع جديد"
  maxScore: number; // مثال: 1
}

export interface Criterion {
  id: string;
  name: string; // مثال: "الأصالة والإبداع"
  indicators: Indicator[];
}

// كل لجنة تُسند معاييرها لمحكّمين معينين
export interface CommitteeCriterionAssignment {
  id: string;
  committeeId: string;
  criterionId: string;
  judgeUserId: string; // المحكّم المسؤول عن هذا المعيار في هذه اللجنة
}

// ---------- المشاركون ----------

export interface Participant {
  id: string;
  fullName: string;
  birthDate: string; // ISO date string
  age: number;
  categoryId: string;
  circleId: string; // الدائرة التي سجّل فيها في التصفيات
  municipality: string; // البلدية
  phaseId: string; // المرحلة الحالية للمشارك
  qualified: boolean; // هل تأهل للمرحلة التالية
  advanced?: boolean; // هل تم ترحيله فعليًا (إنشاء نسخة له في المرحلة التالية)
  qualifiedFromParticipantId?: string; // id النسخة الأصلية في المرحلة السابقة (لو كان هذا مشاركًا مُرحَّلًا)
}

// ---------- الدرجات ----------

export interface IndicatorScore {
  indicatorId: string;
  value: number;
}

export interface Score {
  id: string;
  participantId: string;
  committeeId: string;
  criterionId: string;
  judgeUserId: string;
  indicatorScores: IndicatorScore[];
  total: number; // مجموع درجات المؤشرات لهذا المعيار
  approved: boolean; // اعتماد رئيس اللجنة
}

// ---------- النتائج المحسوبة (مشتقة، ليست مخزّنة كأصل) ----------

export interface ParticipantResult {
  participant: Participant;
  criteriaScores: { criterionId: string; total: number }[];
  average: number; // المعدل النهائي = مجموع درجات المعايير ÷ عدد المعايير
  rank: number;
}