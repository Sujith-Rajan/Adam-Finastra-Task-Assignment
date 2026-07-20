import mongoose, { Document, Schema } from 'mongoose';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface IPrescription {
  otherAdvices?: string;
  medications: IMedication[];
  investigations?: string;
}

export interface IAppointment extends Document {
  doctor: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  appointmentDate: Date;
  slotStartTime: string; // "HH:mm"
  slotEndTime: string;   // "HH:mm"
  status: AppointmentStatus;
  purpose?: string;
  notes?: string;
  prescription?: IPrescription;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentDate: { type: Date, required: true },
    slotStartTime: { type: String, required: true },
    slotEndTime: { type: String, required: true },
    status: { 
      type: String, 
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.SCHEDULED 
    },
    purpose: { type: String, trim: true },
    notes: { type: String, trim: true },
    prescription: {
      otherAdvices: { type: String, trim: true },
      medications: [{
        name: { type: String, trim: true },
        dosage: { type: String, trim: true },
        frequency: { type: String, trim: true }
      }],
      investigations: { type: String, trim: true }
    }
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index to prevent double booking exactly as requested
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, slotStartTime: 1 },
  { unique: true }
);

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
