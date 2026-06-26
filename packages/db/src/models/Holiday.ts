import mongoose, { Schema, Document } from "mongoose";

export interface IHoliday extends Document {
  name: string;
  date: string;
  type: string;
  isOptional: boolean;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const holidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, default: "public" },
    isOptional: { type: Boolean, default: false },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const Holiday = mongoose.model<IHoliday>("Holiday", holidaySchema);
