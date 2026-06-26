import mongoose, { Schema, Document } from "mongoose";

export interface IAppraisal extends Document {
  employeeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  period: string;
  overallRating: number;
  technicalSkills: number;
  communication: number;
  teamwork: number;
  leadership: number;
  comments?: string;
  status: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const appraisalSchema = new Schema<IAppraisal>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    period: { type: String, required: true },
    overallRating: { type: Number, required: true },
    technicalSkills: { type: Number, required: true },
    communication: { type: Number, required: true },
    teamwork: { type: Number, required: true },
    leadership: { type: Number, required: true },
    comments: String,
    status: { type: String, default: "submitted" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const Appraisal = mongoose.model<IAppraisal>("Appraisal", appraisalSchema);
