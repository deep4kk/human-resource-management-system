import mongoose, { Schema, Document } from "mongoose";

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ALL_PERMISSIONS = [
  "employees:read", "employees:create", "employees:update", "employees:delete",
  "departments:read", "departments:create", "departments:update", "departments:delete",
  "attendance:read", "attendance:create", "attendance:update", "attendance:delete",
  "leaves:read", "leaves:create", "leaves:update", "leaves:delete",
  "payroll:read", "payroll:create", "payroll:update", "payroll:delete",
  "timesheets:read", "timesheets:create", "timesheets:update", "timesheets:delete",
  "performance:read", "performance:create", "performance:update", "performance:delete",
  "announcements:read", "announcements:create", "announcements:update", "announcements:delete",
  "policies:read", "policies:create", "policies:update", "policies:delete",
  "holidays:read", "holidays:create", "holidays:update", "holidays:delete",
  "documents:read", "documents:create", "documents:update", "documents:delete",
  "branding:read", "branding:update",
  "biometrics:read", "biometrics:update",
  "leave-rules:read", "leave-rules:create", "leave-rules:update", "leave-rules:delete",
  "users:read", "users:create", "users:update", "users:delete",
  "roles:read", "roles:create", "roles:update", "roles:delete",
  "audit:read",
  "settings:read", "settings:update",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    description: String,
    permissions: [{ type: String, enum: ALL_PERMISSIONS }],
    isSystem: { type: Boolean, default: false },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

roleSchema.index({ companyId: 1, name: 1 }, { unique: true });

export const Role = mongoose.model<IRole>("Role", roleSchema);
