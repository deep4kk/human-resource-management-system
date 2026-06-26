import mongoose, { Schema, Document } from "mongoose";

export interface ITimesheet extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: string;
  project: string;
  task: string;
  hours: number;
  billable: boolean;
  description?: string;
  status: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const timesheetSchema = new Schema<ITimesheet>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true },
    project: { type: String, required: true },
    task: { type: String, required: true },
    hours: { type: Number, required: true },
    billable: { type: Boolean, default: true },
    description: String,
    status: { type: String, default: "pending" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const Timesheet = mongoose.model<ITimesheet>("Timesheet", timesheetSchema);
