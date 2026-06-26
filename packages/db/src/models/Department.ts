import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  description?: string;
  headId?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true },
    description: String,
    headId: { type: Schema.Types.ObjectId, ref: "Employee" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const Department = mongoose.model<IDepartment>("Department", departmentSchema);
