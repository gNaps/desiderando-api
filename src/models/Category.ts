import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema({
  name: { type: String, require: true },
});

export const Category = mongoose.model("category", categorySchema);

export interface ICategory {
  name: string;
}
