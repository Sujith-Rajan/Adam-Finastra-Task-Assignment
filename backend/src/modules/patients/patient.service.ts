import { Patient } from './patient.model';
import { ApiError } from '../../errors/ApiError';
import { Appointment } from '../appointments/appointment.model';

class PatientService {
  public async createPatient(data: any) {
    const existingPatient = await Patient.findOne({ phoneNumber: data.phoneNumber });
    if (existingPatient) {
      throw new ApiError(409, 'Patient with this phone number already exists');
    }

    const patient = new Patient(data);
    await patient.save();
    return patient;
  }

  public async getPatients(query: any = {}) {
    const { page = 1, limit = 10, search, doctorId } = query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const matchStage: any = { isActive: true };

    if (doctorId) {
      const patientIds = await Appointment.distinct('patient', { doctor: doctorId });
      matchStage._id = { $in: patientIds };
    }

    if (search) {
      matchStage.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { patientID: { $regex: search, $options: 'i' } }
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(matchStage).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Patient.countDocuments(matchStage)
    ]);

    return {
      patients,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  public async getPatientById(id: string) {
    const patient = await Patient.findOne({ _id: id, isActive: true });
    if (!patient) throw new ApiError(404, 'Patient not found');
    return patient;
  }

  public async updatePatient(id: string, data: any) {
    if (data.phoneNumber) {
      const existing = await Patient.findOne({ phoneNumber: data.phoneNumber, _id: { $ne: id } });
      if (existing) throw new ApiError(409, 'Phone number already in use');
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!patient) throw new ApiError(404, 'Patient not found');
    return patient;
  }

  public async deletePatient(id: string) {
    const patient = await Patient.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!patient) throw new ApiError(404, 'Patient not found');
    return patient;
  }
}

export const patientService = new PatientService();
