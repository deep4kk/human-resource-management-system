import mongoose, { Schema, Document } from "mongoose";

export interface IBiometricSetting extends Document {
  deviceBrand: string;
  deviceModel?: string;
  serialNumber?: string;
  location?: string;
  importFormat: string;
  dateFormat: string;
  timeFormat: string;
  isActive: boolean;
  lastSyncAt?: Date;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const biometricSettingSchema = new Schema<IBiometricSetting>(
  {
    deviceBrand: { type: String, required: true },
    deviceModel: String,
    serialNumber: String,
    location: String,
    importFormat: { type: String, default: "csv" },
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    timeFormat: { type: String, default: "HH:mm" },
    isActive: { type: Boolean, default: true },
    lastSyncAt: Date,
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

export const BiometricSetting = mongoose.model<IBiometricSetting>("BiometricSetting", biometricSettingSchema);
