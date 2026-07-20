import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { sendResponse } from '../../responses/apiResponse';

export const createDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user._id.toString();
    const result = await adminService.createDoctor(req.body, adminId);
    
    sendResponse(res, 201, true, 'Doctor created successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.doctorId as string;
    const result = await adminService.updateDoctor(doctorId, req.body);
    
    sendResponse(res, 200, true, 'Doctor updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.doctorId as string;
    const result = await adminService.deleteDoctor(doctorId);
    
    sendResponse(res, 200, true, 'Doctor deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createReceptionist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user._id.toString();
    const result = await adminService.createReceptionist(req.body, adminId);
    
    sendResponse(res, 201, true, 'Receptionist created successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateDoctorSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.doctorId as string;
    const { schedules } = req.body;
    
    const result = await adminService.updateDoctorSchedule(doctorId, schedules);
    
    sendResponse(res, 200, true, 'Doctor schedule updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDoctorSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.doctorId as string;
    const result = await adminService.getDoctorSchedule(doctorId);
    
    sendResponse(res, 200, true, 'Doctor schedule fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const { permissions } = req.body;
    
    const result = await adminService.updateUserPermissions(userId, permissions);
    
    sendResponse(res, 200, true, 'User permissions updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search } = req.query;
    
    const result = await adminService.getDoctors({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      includeInactive: req.user.role === 'SUPER_ADMIN'
    });
    
    sendResponse(res, 200, true, 'Doctors fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getReceptionists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search } = req.query;
    
    const result = await adminService.getReceptionists({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      includeInactive: req.user.role === 'SUPER_ADMIN'
    });
    
    sendResponse(res, 200, true, 'Receptionists fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateReceptionist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receptionistId = req.params.receptionistId as string;
    const result = await adminService.updateReceptionist(receptionistId, req.body);
    
    sendResponse(res, 200, true, 'Receptionist updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const deleteReceptionist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receptionistId = req.params.receptionistId as string;
    const result = await adminService.deleteReceptionist(receptionistId);
    
    sendResponse(res, 200, true, 'Receptionist deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
