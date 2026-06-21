import { Schema, model } from "mongoose";

export interface ICategory {
  name: string;
  order: number;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>("Category", categorySchema);