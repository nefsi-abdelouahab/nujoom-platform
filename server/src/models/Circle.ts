import { Schema, model, Types } from "mongoose";

export interface ICircle {
  name: string;
  phaseId: Types.ObjectId;
}

const circleSchema = new Schema<ICircle>(
  {
    name: { type: String, required: true, trim: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase", required: true },
  },
  { timestamps: true }
);

export const Circle = model<ICircle>("Circle", circleSchema);