import { Schema, model } from "mongoose";

export interface IIndicator {
  name: string;
  maxScore: number;
}

export interface ICriterion {
  name: string;
  indicators: IIndicator[];
}

// المؤشرات Embedded Documents داخل المعيار، لا Collection منفصلة (حسب القسم 16.1)
const indicatorSchema = new Schema<IIndicator>(
  {
    name: { type: String, required: true, trim: true },
    maxScore: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const criterionSchema = new Schema<ICriterion>(
  {
    name: { type: String, required: true, trim: true },
    indicators: { type: [indicatorSchema], default: [] },
  },
  { timestamps: true }
);

export const Criterion = model<ICriterion>("Criterion", criterionSchema);