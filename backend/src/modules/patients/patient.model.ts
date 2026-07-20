import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  patientID: string;

  firstName: string;
  lastName: string;

  gender: 'MALE' | 'FEMALE' | 'OTHER';

  phoneNumber: string;
  email?: string;

  dob: Date;
  age: number;

  bloodGroup?: string;

  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };

  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pinCode?: string;
  };

  allergies?: string[];

  medicalHistory?: string[];

  isActive: boolean;

  createdBy?: Schema.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientID: { type: String, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: { 
      type: String, 
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true 
    },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true },
    dob: { type: Date, required: true },
    bloodGroup: { type: String, trim: true },
    maritalStatus: {
      type: String,
      enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']
    },
    emergencyContact: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phoneNumber: { type: String, trim: true },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pinCode: { type: String, trim: true },
    },
    allergies: [{ type: String, trim: true }],
    medicalHistory: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for calculating age
patientSchema.virtual('age').get(function () {
  if (!this.dob) return 0;
  const ageDiffMs = Date.now() - this.dob.getTime();
  const ageDate = new Date(ageDiffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
});

// Pre-save hook to generate patientID
patientSchema.pre('save', async function () {
  if (this.isNew && !this.patientID) {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const model = this.constructor as mongoose.Model<IPatient>;
    
    const count = await model.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    
    const countStr = String(count + 1).padStart(3, '0');
    this.patientID = `PID${month}${year}${countStr}`;
  }
});

export const Patient = mongoose.model<IPatient>('Patient', patientSchema);
