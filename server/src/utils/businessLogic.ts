import { Types } from "mongoose";
import { IIndicatorScore } from "../models/Score";

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateTotal(indicatorScores: IIndicatorScore[]): number {
  return indicatorScores.reduce((sum, i) => sum + i.value, 0);
}

/**
 * يقابل getRankWithTies في lib/utils.ts — قاعدة "لا يتم كسر التعادل":
 * المشاركون بنفس المعدل يحصلون على نفس الترتيب.
 */
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

export function toIdString(id: Types.ObjectId | string): string {
  return id.toString();
}

/**
 * يقابل calculateParticipantAverage في lib/utils.ts تمامًا:
 * المعدل النهائي للمشارك = مجموع درجات كل المعايير (total لكل سجل Score) ÷ عدد المعايير.
 * يأخذ كل سجلات Score الخاصة بهذا المشارك في هذه اللجنة (بصرف النظر عن المحكّم،
 * لأن كل معيار سيكون له سجل Score واحد فقط فعليًا لكل مشارك — راجع القسم 7 في التوثيق).
 */
export interface ParticipantAverageResult {
  average: number;
  criteriaScores: { criterionId: string; total: number }[];
}

export function calculateParticipantAverage(
  participantScores: { criterionId: Types.ObjectId | string; total: number }[]
): ParticipantAverageResult {
  const criteriaScores = participantScores.map((s) => ({
    criterionId: s.criterionId.toString(),
    total: s.total,
  }));

  if (criteriaScores.length === 0) {
    return { average: 0, criteriaScores: [] };
  }

  const sum = criteriaScores.reduce((acc, c) => acc + c.total, 0);
  const average = sum / criteriaScores.length;

  return { average, criteriaScores };
}