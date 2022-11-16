import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  age: { type: Number, required: true },
  sex: {
    type: String,
    enum: ["MALE", "FEMALE", "OTHER", "NONE"],
    default: "NONE",
  },
  password: {
    type: String,
    required: true,
  },
  image: { type: String },
  friends: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      status: { type: String },
    },
  ],
});

export const User = mongoose.model("user", userSchema);

export interface IUser {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: string;
  password: string;
  image: string;
  friends: { user: string; status: string }[];
}
