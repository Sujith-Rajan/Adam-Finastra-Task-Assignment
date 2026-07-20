import { Request, Response, NextFunction } from 'express';
import { Patient } from './patient.model';
import { patientService } from './patient.service';
import { sendResponse } from '../../responses/apiResponse';

export const searchPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length < 3) {
      return sendResponse(res, 200, true, 'Please provide at least 3 characters', []);
    }

    // Search by phone number or patientID (case-insensitive)
    const patients = await Patient.find({
      isActive: true,
      $or: [
        { phoneNumber: { $regex: query, $options: 'i' } },
        { patientID: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    sendResponse(res, 200, true, 'Patients retrieved successfully', patients);
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await patientService.createPatient(req.body);
    sendResponse(res, 201, true, 'Patient created successfully', result);
  } catch (error) {
    next(error);
  }
};

import { Role } from '../users/user.model';
import { Doctor } from '../users/doctor.model';

export const getPatients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query: any = { ...req.query };

    // If user is a doctor, they should only see patients they have an appointment with
    if (req.user.role === Role.DOCTOR) {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (doctorProfile) {
        query.doctorId = doctorProfile._id.toString();
      }
    }

    const result = await patientService.getPatients(query);
    sendResponse(res, 200, true, 'Patients retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await patientService.getPatientById(req.params.id as string);
    sendResponse(res, 200, true, 'Patient retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await patientService.updatePatient(req.params.id as string, req.body);
    sendResponse(res, 200, true, 'Patient updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await patientService.deletePatient(req.params.id as string);
    sendResponse(res, 200, true, 'Patient deleted successfully');
  } catch (error) {
    next(error);
  }
};
