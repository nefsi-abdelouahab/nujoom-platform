import { User } from "@/types";

export const users: User[] = [
  // مدير النظام
  {
    id: "user-admin-1",
    username: "admin",
    password: "admin123",
    fullName: "مدير النظام",
    role: "admin",
    committeeIds: [],
  },

  // رؤساء اللجان (لجنة واحدة لكل رئيس، كل رئيس يحكّم معيارًا أيضًا)
  {
    id: "user-head-1",
    username: "head1",
    password: "123456",
    fullName: "رئيس لجنة الدائرة الشرقية",
    role: "head",
    committeeIds: ["committee-1"],
    criterionId: "criterion-1",
  },
  {
    id: "user-head-2",
    username: "head2",
    password: "123456",
    fullName: "رئيس لجنة الدائرة الغربية",
    role: "head",
    committeeIds: ["committee-2"],
    criterionId: "criterion-1",
  },
  {
    id: "user-head-3",
    username: "head3",
    password: "123456",
    fullName: "رئيس لجنة الدائرة الشمالية",
    role: "head",
    committeeIds: ["committee-3"],
    criterionId: "criterion-1",
  },
  {
    id: "user-head-4",
    username: "head4",
    password: "123456",
    fullName: "رئيس لجنة الدائرة الجنوبية",
    role: "head",
    committeeIds: ["committee-4"],
    criterionId: "criterion-1",
  },
  {
    id: "user-head-5",
    username: "head5",
    password: "123456",
    fullName: "رئيس لجنة نصف النهائي",
    role: "head",
    committeeIds: ["committee-5"],
    criterionId: "criterion-1",
  },
  {
    id: "user-head-6",
    username: "head6",
    password: "123456",
    fullName: "رئيس لجنة النهائي",
    role: "head",
    committeeIds: ["committee-6"],
    criterionId: "criterion-1",
  },

  // محكّمون (كل محكّم مسؤول عن معيار واحد فقط في لجنة واحدة)
  // محكّمو لجنة الدائرة الشرقية (committee-1)
  {
    id: "user-judge-1",
    username: "judge1",
    password: "123456",
    fullName: "المحكّم الأول - الشرقية",
    role: "judge",
    committeeIds: ["committee-1"],
    criterionId: "criterion-2",
  },
  {
    id: "user-judge-2",
    username: "judge2",
    password: "123456",
    fullName: "المحكّم الثاني - الشرقية",
    role: "judge",
    committeeIds: ["committee-1"],
    criterionId: "criterion-3",
  },
  {
    id: "user-judge-3",
    username: "judge3",
    password: "123456",
    fullName: "المحكّم الثالث - الشرقية",
    role: "judge",
    committeeIds: ["committee-1"],
    criterionId: "criterion-4",
  },

  // محكّمو لجنة الدائرة الغربية (committee-2)
  {
    id: "user-judge-4",
    username: "judge4",
    password: "123456",
    fullName: "المحكّم الأول - الغربية",
    role: "judge",
    committeeIds: ["committee-2"],
    criterionId: "criterion-2",
  },
  {
    id: "user-judge-5",
    username: "judge5",
    password: "123456",
    fullName: "المحكّم الثاني - الغربية",
    role: "judge",
    committeeIds: ["committee-2"],
    criterionId: "criterion-3",
  },
  {
    id: "user-judge-6",
    username: "judge6",
    password: "123456",
    fullName: "المحكّم الثالث - الغربية",
    role: "judge",
    committeeIds: ["committee-2"],
    criterionId: "criterion-4",
  },
];
