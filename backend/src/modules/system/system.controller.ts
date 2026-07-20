import { Request, Response, NextFunction } from 'express';
import { systemService } from './system.service';
import { sendResponse } from '../../responses/apiResponse';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const departments = await systemService.getDepartments(activeOnly);
    sendResponse(res, 200, true, 'Departments fetched successfully', departments);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const dept = await systemService.createDepartment(name);
    sendResponse(res, 201, true, 'Department created', dept);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dept = await systemService.updateDepartment(id, req.body);
    sendResponse(res, 200, true, 'Department updated', dept);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await systemService.deleteDepartment(id);
    sendResponse(res, 200, true, 'Department deleted');
  } catch (error) {
    next(error);
  }
};

export const getSpecializations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const specs = await systemService.getSpecializations(activeOnly);
    sendResponse(res, 200, true, 'Specializations fetched successfully', specs);
  } catch (error) {
    next(error);
  }
};

export const createSpecialization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const spec = await systemService.createSpecialization(name);
    sendResponse(res, 201, true, 'Specialization created', spec);
  } catch (error) {
    next(error);
  }
};

export const updateSpecialization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const spec = await systemService.updateSpecialization(id, req.body);
    sendResponse(res, 200, true, 'Specialization updated', spec);
  } catch (error) {
    next(error);
  }
};

export const deleteSpecialization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await systemService.deleteSpecialization(id);
    sendResponse(res, 200, true, 'Specialization deleted');
  } catch (error) {
    next(error);
  }
};
