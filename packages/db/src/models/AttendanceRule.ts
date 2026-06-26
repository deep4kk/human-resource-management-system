import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceRule extends Document {
  ruleName: string;
  description?: string;
  isActive: boolean;
  appliesTo: string;
  shiftStart: string;
  shiftEnd: string;
  expectedHours: number;
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
  halfDayEnabled: boolean;
  halfDayMaxHours: number;
  halfDayMinHours: number;
  shortLeaveEnabled: boolean;
  shortLeaveMaxHours: number;
  shortLeaveMaxPerMonth: number;
  absentIfNoCheckIn: boolean;
  absentCheckInCutoff?: string;
  overtimeEnabled: boolean;
  overtimeThresholdHours?: number;
  weekendDays: string;
  countHolidaysAsPresent: boolean;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRuleSchema = new Schema<IAttendanceRule>(
  {
    ruleName: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: true },
    appliesTo: { type: String, default: "all" },
    shiftStart: { type: String, default: "09:00:00" },
    shiftEnd: { type: String, default: "18:00:00" },
    expectedHours: { type: Number, default: 8.0 },
    gracePeriodMinutes: { type: Number, default: 15 },
    lateThresholdMinutes: { type: Number, default: 30 },
    halfDayEnabled: { type: Boolean, default: true },
    halfDayMaxHours: { type: Number, default: 4.5 },
    halfDayMinHours: { type: Number, default: 3.0 },
    shortLeaveEnabled: { type: Boolean, default: true },
    shortLeaveMaxHours: { type: Number, default: 2.0 },
    shortLeaveMaxPerMonth: { type: Number, default: 2 },
    absentIfNoCheckIn: { type: Boolean, default: false },
    absentCheckInCutoff: String,
    overtimeEnabled: { type: Boolean, default: false },
    overtimeThresholdHours: Number,
    weekendDays: { type: String, default: "saturday,sunday" },
    countHolidaysAsPresent: { type: Boolean, default: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const AttendanceRule = mongoose.model<IAttendanceRule>("AttendanceRule", attendanceRuleSchema);
