import mongoose, { Schema } from "mongoose";

const passwordTokenSchema = new Schema({
  user: { type: String, required: true },
  token: { type: String, required: true },
  expiredAt: {
    type: Date,
    required: true,
    default: new Date().setHours(new Date().getHours() + 2),
  },
});

export const PasswordToken = mongoose.model(
  "passwordToken",
  passwordTokenSchema
);

export interface IGift {
  user: string;
  token: string;
  expiredAt: Date;
}
