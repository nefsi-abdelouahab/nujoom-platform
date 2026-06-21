import { Committee } from "@/types";

export const committees: Committee[] = [
  // لجان التصفيات (واحدة لكل دائرة)
  {
    id: "committee-1",
    name: "لجنة الدائرة الشرقية",
    phaseId: "phase-1",
    circleId: "circle-1",
    headUserId: "user-head-1",
  },
  {
    id: "committee-2",
    name: "لجنة الدائرة الغربية",
    phaseId: "phase-1",
    circleId: "circle-2",
    headUserId: "user-head-2",
  },
  {
    id: "committee-3",
    name: "لجنة الدائرة الشمالية",
    phaseId: "phase-1",
    circleId: "circle-3",
    headUserId: "user-head-3",
  },
  {
    id: "committee-4",
    name: "لجنة الدائرة الجنوبية",
    phaseId: "phase-1",
    circleId: "circle-4",
    headUserId: "user-head-4",
  },
  // لجنة نصف النهائي
  {
    id: "committee-5",
    name: "لجنة نصف النهائي",
    phaseId: "phase-2",
    headUserId: "user-head-5",
  },
  // لجنة النهائي
  {
    id: "committee-6",
    name: "لجنة النهائي",
    phaseId: "phase-3",
    headUserId: "user-head-6",
  },
];
