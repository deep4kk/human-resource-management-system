import mongoose, { Schema, Document } from "mongoose";

export interface IKpi extends Document {
  employeeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  target: number;
  achieved: number;
  unit: string;
  period: string;
  status: string;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const kpiSchema = new Schema<IKpi>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    title: { type: String, required: true },
    description: String,
    target: { type: Number, required: true },
    achieved: { type: Number, default: 0 },
    unit: { type: String, required: true },
    period: { type: String, required: true },
    status: { type: String, default: "on_track" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const Kpi = mongoose.model<IKpi>("Kpi", kpiSchema);
