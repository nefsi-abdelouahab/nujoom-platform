import { Schema, model, Types } from "mongoose";

export interface IIndicatorScore {
  indicatorId: Types.ObjectId;
  value: number;
}

export interface IScore {
  participantId: Types.ObjectId;
  committeeId: Types.ObjectId;
  criterionId: Types.ObjectId;
  judgeUserId: Types.ObjectId;
  indicatorScores: IIndicatorScore[];
  total: number;
  approved: boolean;
}

const indicatorScoreSchema = new Schema<IIndicatorScore>(
  {
    indicatorId: { type: Schema.Types.ObjectId, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const scoreSchema = new Schema<IScore>(
  {
    participantId: { type: Schema.Types.ObjectId, ref: "Participant", required: true },
    committeeId: { type: Schema.Types.ObjectId, ref: "Committee", required: true },
    criterionId: { type: Schema.Types.ObjectId, ref: "Criterion", required: true },
    judgeUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    indicatorScores: { type: [indicatorScoreSchema], default: [] },
    total: { type: Number, required: true, default: 0 },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// يقابل منطق saveScore الحالي: نفس (مشارك + لجنة + معيار + محكّم) = تحديث، وليس تكرار
scoreSchema.index(
  { participantId: 1, committeeId: 1, criterionId: 1, judgeUserId: 1 },
  { unique: true }
);

export const Score = model<IScore>("Score", scoreSchema);