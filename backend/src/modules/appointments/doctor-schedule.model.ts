import mongoose, { Document, Schema } from 'mongoose';

export interface ISession {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface IDoctorSchedule extends Document {
  doctor: mongoose.Types.ObjectId;
  dayOfWeek: string; // e.g., 'Monday', 'Tuesday'
  sessions: ISession[];
  slotDuration: number; // in minutes, e.g., 15
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const doctorScheduleSchema = new Schema<IDoctorSchedule>(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    dayOfWeek: { 
      type: String, 
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    sessions: [sessionSchema],
    slotDuration: { type: Number, required: true, default: 15 },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate schedules for the same doctor on the same day
doctorScheduleSchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true });

export const DoctorSchedule = mongoose.model<IDoctorSchedule>('DoctorSchedule', doctorScheduleSchema);
