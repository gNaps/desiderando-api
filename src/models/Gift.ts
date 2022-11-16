import mongoose, { Schema } from "mongoose";

const giftSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  location: { type: String },
  tags: { type: [String] },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  expiredAt: { type: Date },
  giftedAt: { type: Date },
  image: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  giftBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
});

export const Gift = mongoose.model("gift", giftSchema);

export interface IGift {
  name: string;
  description: string;
  price: number;
  location: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date;
  giftedAt: Date;
  image: string;
  createdBy: string;
}
