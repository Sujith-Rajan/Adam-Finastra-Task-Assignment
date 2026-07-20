import { Request, Response, NextFunction } from 'express';
import { activityLogService } from './activity-log.service';
import { sendResponse } from '../../responses/apiResponse';

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userRole = req.query.userRole as string;
    const action = req.query.action as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await activityLogService.getLogs({
      page,
      limit,
      userRole,
      action,
      startDate,
      endDate
    });

    sendResponse(res, 200, true, 'Activity logs retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
