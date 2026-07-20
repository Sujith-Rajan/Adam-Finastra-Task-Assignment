import mongoose, { Document, Schema } from 'mongoose';

export interface IReceptionist extends Document {
  user: mongoose.Types.ObjectId; // Reference to the base User document
  shiftTimings: string;
  deskNumber?: string;
  languagesSpoken: string[];
  emergencyContact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const receptionistSchema = new Schema<IReceptionist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // A user can only have one receptionist profile
    },
    shiftTimings: { type: String, required: true, trim: true },
    deskNumber: { type: String, trim: true },
    languagesSpoken: [{ type: String, trim: true }],
    emergencyContact: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);



export const Receptionist = mongoose.model<IReceptionist>('Receptionist', receptionistSchema);
