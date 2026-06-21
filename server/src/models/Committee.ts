import { Schema, model, Types } from "mongoose";

export interface ICommittee {
  name: string;
  phaseId: Types.ObjectId;
  circleId?: Types.ObjectId; // موجود فقط للجان التصفيات
  headUserId?: Types.ObjectId;
}

const committeeSchema = new Schema<ICommittee>(
  {
    name: { type: String, required: true, trim: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase", required: true },
    circleId: { type: Schema.Types.ObjectId, ref: "Circle" },
    headUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Committee = model<ICommittee>("Committee", committeeSchema);