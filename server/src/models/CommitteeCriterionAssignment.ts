import { Schema, model, Types } from "mongoose";

export interface ICommitteeCriterionAssignment {
  committeeId: Types.ObjectId;
  criterionId: Types.ObjectId;
  judgeUserId: Types.ObjectId;
}

const assignmentSchema = new Schema<ICommitteeCriterionAssignment>(
  {
    committeeId: { type: Schema.Types.ObjectId, ref: "Committee", required: true },
    criterionId: { type: Schema.Types.ObjectId, ref: "Criterion", required: true },
    judgeUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// مهم جدًا: لا قيد Unique على (committeeId + criterionId) فقط — يسمح بعدة محكّمين لنفس المعيار.
// القيد الوحيد هو منع تكرار نفس المحكّم لنفس المعيار في نفس اللجنة (راجع القسم 7 والقسم 16.6).
assignmentSchema.index(
  { committeeId: 1, criterionId: 1, judgeUserId: 1 },
  { unique: true }
);

export const CommitteeCriterionAssignment = model<ICommitteeCriterionAssignment>(
  "CommitteeCriterionAssignment",
  assignmentSchema
);