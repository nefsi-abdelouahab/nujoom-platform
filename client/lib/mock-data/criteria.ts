import { Criterion } from "@/types";

export const criteria: Criterion[] = [
  {
    id: "criterion-1",
    name: "المعيار الأول",
    indicators: [
      { id: "ind-1-1", name: "المؤشر الأول", maxScore: 1 },
      { id: "ind-1-2", name: "المؤشر الثاني", maxScore: 1 },
      { id: "ind-1-3", name: "المؤشر الثالث", maxScore: 1 },
    ],
  },
  {
    id: "criterion-2",
    name: "المعيار الثاني",
    indicators: [
      { id: "ind-2-1", name: "المؤشر الأول", maxScore: 1 },
      { id: "ind-2-2", name: "المؤشر الثاني", maxScore: 1 },
    ],
  },
  {
    id: "criterion-3",
    name: "المعيار الثالث",
    indicators: [
      { id: "ind-3-1", name: "المؤشر الأول", maxScore: 1 },
      { id: "ind-3-2", name: "المؤشر الثاني", maxScore: 1 },
      { id: "ind-3-3", name: "المؤشر الثالث", maxScore: 1 },
      { id: "ind-3-4", name: "المؤشر الرابع", maxScore: 1 },
    ],
  },
  {
    id: "criterion-4",
    name: "المعيار الرابع",
    indicators: [
      { id: "ind-4-1", name: "المؤشر الأول", maxScore: 1 },
      { id: "ind-4-2", name: "المؤشر الثاني", maxScore: 1 },
    ],
  },
];
