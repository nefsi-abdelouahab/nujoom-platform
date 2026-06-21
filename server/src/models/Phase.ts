import { Schema, model } from "mongoose";

export type PhaseType = "qualifiers" | "semifinal" | "final";

export interface IPhase {
  name: string;
  type: PhaseType;
  order: number;
}

const phaseSchema = new Schema<IPhase>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["qualifiers", "semifinal", "final"], required: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Phase = model<IPhase>("Phase", phaseSchema);