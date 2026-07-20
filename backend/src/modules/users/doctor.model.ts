import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  user: mongoose.Types.ObjectId; // Reference to the base User document
  specialization: string;
  experienceYears: number;
  qualifications: string[];
  department: string;
  consultationFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // A user can only have one doctor profile
    },
    specialization: { type: String, required: true, trim: true },
    experienceYears: { type: Number, required: true },
    qualifications: [{ type: String, trim: true }],
    department: { type: String, trim: true },
    consultationFee: { type: Number },
  },
  {
    timestamps: true,
  }
);


export const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);
