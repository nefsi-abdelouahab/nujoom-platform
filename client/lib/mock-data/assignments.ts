import { CommitteeCriterionAssignment } from "@/types";

// كل سجل يربط: لجنة واحدة + معيار واحد + محكّم واحد مسؤول عنه فقط
export const committeeCriterionAssignments: CommitteeCriterionAssignment[] = [
  // لجنة الدائرة الشرقية (committee-1)
  { id: "assign-1", committeeId: "committee-1", criterionId: "criterion-1", judgeUserId: "user-head-1" },
  { id: "assign-2", committeeId: "committee-1", criterionId: "criterion-2", judgeUserId: "user-judge-1" },
  { id: "assign-3", committeeId: "committee-1", criterionId: "criterion-3", judgeUserId: "user-judge-2" },
  { id: "assign-4", committeeId: "committee-1", criterionId: "criterion-4", judgeUserId: "user-judge-3" },

  // لجنة الدائرة الغربية (committee-2)
  { id: "assign-5", committeeId: "committee-2", criterionId: "criterion-1", judgeUserId: "user-head-2" },
  { id: "assign-6", committeeId: "committee-2", criterionId: "criterion-2", judgeUserId: "user-judge-4" },
  { id: "assign-7", committeeId: "committee-2", criterionId: "criterion-3", judgeUserId: "user-judge-5" },
  { id: "assign-8", committeeId: "committee-2", criterionId: "criterion-4", judgeUserId: "user-judge-6" },
];
