import mongoose, { Schema, Document } from "mongoose";

export interface IGeneratedDocument extends Document {
  templateId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  name: string;
  content: string;
  generatedBy?: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const generatedDocumentSchema = new Schema<IGeneratedDocument>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "DocumentTemplate", required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const GeneratedDocument = mongoose.model<IGeneratedDocument>("GeneratedDocument", generatedDocumentSchema);
