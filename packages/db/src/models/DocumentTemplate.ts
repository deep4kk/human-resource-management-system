import mongoose, { Schema, Document } from "mongoose";

export interface IDocumentTemplate extends Document {
  name: string;
  type: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const documentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const DocumentTemplate = mongoose.model<IDocumentTemplate>("DocumentTemplate", documentTemplateSchema);
