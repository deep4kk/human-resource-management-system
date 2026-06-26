import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  priority: string;
  targetRoles: string;
  isActive: boolean;
  publishedBy?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    priority: { type: String, default: "normal" },
    targetRoles: { type: String, default: "all" },
    isActive: { type: Boolean, default: true },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: Date,
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const Announcement = mongoose.model<IAnnouncement>("Announcement", announcementSchema);
