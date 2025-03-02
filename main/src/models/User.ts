import { Schema, model, models, Model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
}

const userSchema = new Schema<IUser>({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String }
});

const User: Model<IUser> = models.User || model<IUser>("User", userSchema);

export default User;
