import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

const generateReadableID = (role: Role) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.randomBytes(7); // Adjusted to 7 to make total length around 10-12
  for (let i = 0; i < 7; i++) {
    result += chars[bytes[i] % chars.length];
  }

  let prefix = 'USR';
  if (role === Role.SUPER_ADMIN) prefix = 'SA';
  if (role === Role.RECEPTIONIST) prefix = 'REC';
  if (role === Role.DOCTOR) prefix = 'DOC';

  return `${prefix}-${result}`;
};

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RECEPTIONIST = 'RECEPTIONIST',
  DOCTOR = 'DOCTOR',
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  employeeID: string;
  passwordHash: string;
  role: Role;
  permissions?: string[]; // user-level menu overrides
  mobile?: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    employeeID: {
      type: String,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    permissions: {
      type: [String],
      default: undefined, // undefined means use role default
    },
    mobile: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  {
    timestamps: true,
  }
);

// Indexes


userSchema.pre('save', function () {
  if (this.isNew && !this.employeeID) {
    this.employeeID = generateReadableID(this.role);
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
