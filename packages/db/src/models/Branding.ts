import mongoose, { Schema, Document } from "mongoose";

export interface IBranding extends Document {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  theme: string;
  tagline?: string;
  companyId: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const brandingSchema = new Schema<IBranding>(
  {
    companyName: { type: String, required: true },
    logoUrl: String,
    primaryColor: { type: String, default: "#6366f1" },
    accentColor: { type: String, default: "#8b5cf6" },
    theme: { type: String, default: "light" },
    tagline: String,
    companyId: { type: Schema.Types.ObjectId, ref: "Company", sparse: true },
  },
  { timestamps: true },
);

export const Branding = mongoose.model<IBranding>("Branding", brandingSchema);
