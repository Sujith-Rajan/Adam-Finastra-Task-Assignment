import mongoose, { Document, Schema } from 'mongoose';

export interface ISpecialization extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const specializationSchema = new Schema<ISpecialization>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Specialization = mongoose.model<ISpecialization>('Specialization', specializationSchema);
