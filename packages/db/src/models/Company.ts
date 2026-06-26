import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  email: string;
  passwordHash: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Company = mongoose.model<ICompany>("Company", companySchema);
