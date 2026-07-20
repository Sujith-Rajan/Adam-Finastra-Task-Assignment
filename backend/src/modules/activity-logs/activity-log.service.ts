import { ActivityLog, IActivityLog, ActivityStatus, ActivityAction } from './activity-log.model';
import mongoose from 'mongoose';

interface CreateLogParams {
  userId?: string | mongoose.Types.ObjectId;
  userRole?: string;
  action: string | ActivityAction;
  entity?: string;
  entityId?: string | mongoose.Types.ObjectId;
  details?: any;
  ipAddress?: string;
  status?: ActivityStatus;
}

interface GetLogsFilters {
  userRole?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class ActivityLogService {
  /**
   * Create a new activity log entry.
   * Fails silently (logs to console) if DB error occurs so it doesn't break main workflows.
   */
  public async logActivity(params: CreateLogParams): Promise<void> {
    try {
      const log = new ActivityLog({
        user: params.userId,
        userRole: params.userRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details,
        ipAddress: params.ipAddress,
        status: params.status || ActivityStatus.SUCCESS
      });
      await log.save();
    } catch (error) {
      console.error('Failed to save activity log:', error);
    }
  }

  /**
   * Retrieve paginated and filtered activity logs
   */
  public async getLogs(filters: GetLogsFilters) {
    const { 
      userRole, action, startDate, endDate, 
      page = 1, limit = 20 
    } = filters;

    const query: any = {};

    if (userRole) {
      query.userRole = userRole;
    }
    
    if (action) {
      query.action = action;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName email'),
      ActivityLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const activityLogService = new ActivityLogService();
