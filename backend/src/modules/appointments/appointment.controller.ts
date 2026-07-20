import { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointment.service';
import { sendResponse } from '../../responses/apiResponse';
import { ApiError } from '../../errors/ApiError';
import { Role } from '../users/user.model';
import { Appointment } from './appointment.model';
import { Doctor } from '../users/doctor.model';

export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    
    // RBAC: Doctors can only view their own appointments
    if (req.user.role === Role.DOCTOR) {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (!doctorProfile) {
        throw new ApiError(404, 'Doctor profile not found');
      }
      query.doctorId = doctorProfile._id.toString();
    }
    
    const result = await appointmentService.getAppointments(query);
    sendResponse(res, 200, true, 'Appointments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    
    // Authorization checks
    const userRole = req.user.role;
    
    if (req.body.notes !== undefined && userRole !== Role.DOCTOR) {
      throw new ApiError(403, 'Only doctors can add or modify appointment notes');
    }
    
    if (req.body.status === 'COMPLETED' && userRole !== Role.DOCTOR) {
      throw new ApiError(403, 'Only doctors can mark an appointment as completed');
    }
    
    if (req.body.prescription !== undefined && userRole !== Role.DOCTOR) {
      throw new ApiError(403, 'Only doctors can update prescriptions');
    }
    
    if (userRole === Role.DOCTOR) {
      const doctorProfile = await Doctor.findOne({ user: req.user._id });
      if (!doctorProfile) {
        throw new ApiError(404, 'Doctor profile not found');
      }
      const appointment = await Appointment.findById(id);
      if (!appointment) throw new ApiError(404, 'Appointment not found');
      
      if (appointment.doctor.toString() !== doctorProfile._id.toString()) {
        throw new ApiError(403, 'You can only update your own appointments');
      }
    }

    const result = await appointmentService.updateAppointment(id, req.body);
    sendResponse(res, 200, true, 'Appointment updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await appointmentService.getAppointmentById(id);
    sendResponse(res, 200, true, 'Appointment retrieved successfully', { appointment: result });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.doctorId as string;
    const date = req.query.date as string;

    const slots = await appointmentService.getAvailableSlots(doctorId, date);
    
    sendResponse(res, 200, true, 'Available slots retrieved', { slots });
  } catch (error) {
    next(error);
  }
};

export const bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await appointmentService.bookAppointment(req.body);
    
    sendResponse(res, 201, true, 'Appointment booked successfully', result);
  } catch (error) {
    next(error);
  }
};
