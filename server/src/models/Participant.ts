import { Schema, model, Types } from "mongoose";

export interface IParticipant {
  fullName: string;
  birthDate: Date;
  age: number;
  categoryId: Types.ObjectId;
  circleId: Types.ObjectId;
  municipality: string;
  phaseId: Types.ObjectId;
  qualified: boolean;
  advanced: boolean;
  qualifiedFromParticipantId?: Types.ObjectId; // self-reference، للترحيل بين المراحل
}

const participantSchema = new Schema<IParticipant>(
  {
    fullName: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: true },
    age: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    circleId: { type: Schema.Types.ObjectId, ref: "Circle", required: true },
    municipality: { type: String, required: true, trim: true },
    phaseId: { type: Schema.Types.ObjectId, ref: "Phase", required: true },
    qualified: { type: Boolean, default: false },
    advanced: { type: Boolean, default: false },
    qualifiedFromParticipantId: { type: Schema.Types.ObjectId, ref: "Participant" },
  },
  { timestamps: true }
);

export const Participant = model<IParticipant>("Participant", participantSchema);