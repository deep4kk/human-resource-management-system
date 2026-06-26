import mongoose, { Schema, Document } from "mongoose";

export interface ICompanyPolicy extends Document {
  title: string;
  category: string;
  content: string;
  version: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companyPolicySchema = new Schema<ICompanyPolicy>(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    version: { type: String, default: "1.0" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const CompanyPolicy = mongoose.model<ICompanyPolicy>("CompanyPolicy", companyPolicySchema);
