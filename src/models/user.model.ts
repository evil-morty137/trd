import { Schema, model } from "mongoose";
import { stringify } from "querystring";

export interface IUser {
  email: string;
  password: string;
  username: string;
  phone: string;
  unhashedPassword: string;
  status: boolean;
  btc: number;
  eth: number;
  usdt: number;
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new Schema<IUser>({
  username: { type: String },
  status: { type: Boolean },
  email: { type: String },
  password: { type: String },
  phone: { type: String },
  btc: { type: Number, default: 0 },
  eth: { type: Number, default: 0 },
  usdt: { type: Number, default: 0 },
  unhashedPassword: { type: String },
  createdAt: { type: Date },
});

const User = model<IUser>("User", userSchema);
export default User;
