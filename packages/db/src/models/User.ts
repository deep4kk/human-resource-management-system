import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "superadmin" | "admin" | "hr" | "manager" | "employee";
  customRoleId?: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  avatar?: string;
  isActive: boolean;
  companyId?: mongoose.Types.ObjectId;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin", "hr", "manager", "employee"],
      default: "employee",
    },
    customRoleId: { type: Schema.Types.ObjectId, ref: "Role" },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee" },
    avatar: String,
    isActive: { type: Boolean, default: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    refreshToken: String,
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
