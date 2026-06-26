import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  workHours?: number;
  notes?: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    date: { type: String, required: true },
    checkIn: String,
    checkOut: String,
    status: { type: String, default: "present" },
    workHours: Number,
    notes: String,
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

attendanceSchema.index({ companyId: 1, employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);
