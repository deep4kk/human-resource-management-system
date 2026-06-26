import mongoose, { Schema, Document } from "mongoose";

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  grossSalary: number;
  pf: number;
  esi: number;
  tds: number;
  deductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  status: string;
  processedAt?: Date;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    hra: { type: Number, required: true },
    allowances: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    pf: { type: Number, required: true },
    esi: { type: Number, required: true },
    tds: { type: Number, required: true },
    deductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    workingDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    status: { type: String, default: "draft" },
    processedAt: Date,
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

payrollSchema.index({ companyId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = mongoose.model<IPayroll>("Payroll", payrollSchema);
