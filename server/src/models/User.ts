import { Schema, model, Types } from "mongoose";

export type UserRole = "admin" | "head" | "judge";

export interface IUser {
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  committeeIds: Types.ObjectId[];
  criterionId?: Types.ObjectId;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "head", "judge"], required: true },
    committeeIds: [{ type: Schema.Types.ObjectId, ref: "Committee" }],
    criterionId: { type: Schema.Types.ObjectId, ref: "Criterion" },
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
