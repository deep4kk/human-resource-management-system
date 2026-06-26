import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  departmentId?: mongoose.Types.ObjectId;
  designation?: string;
  role: string;
  status: string;
  joinDate?: string;
  salary?: number;
  managerId?: mongoose.Types.ObjectId;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeCode: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    avatar: String,
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    designation: String,
    role: { type: String, default: "employee" },
    status: { type: String, default: "active" },
    joinDate: String,
    salary: Number,
    managerId: { type: Schema.Types.ObjectId, ref: "Employee" },
    address: String,
    dateOfBirth: String,
    gender: String,
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

employeeSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);
