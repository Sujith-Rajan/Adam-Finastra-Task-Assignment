import { Request, Response, NextFunction } from 'express';
import { activityLogService } from '../modules/activity-logs/activity-log.service';
import { ActivityAction, ActivityStatus } from '../modules/activity-logs/activity-log.model';

export const apiActivityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Only log modifying requests by default (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // Intercept the response to check the status code before logging
    const originalSend = res.send;

    res.send = function (body: any) {
      // Determine if the request was successful
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      // We don't want to log every single minor action, but we will capture most CRUD operations
      // The entity can often be derived from the base path (e.g. /api/v1/appointments -> Appointment)
      const pathSegments = req.path.split('/').filter(Boolean);
      let entity = pathSegments.length > 0 ? pathSegments[0] : 'System';
      // Capitalize first letter and make singular (very basic heuristic)
      entity = entity.charAt(0).toUpperCase() + entity.slice(1).replace(/s$/, '');

      let action = ActivityAction.OTHER;
      switch (req.method) {
        case 'POST': action = ActivityAction.CREATE; break;
        case 'PUT':
        case 'PATCH': action = ActivityAction.UPDATE; break;
        case 'DELETE': action = ActivityAction.DELETE; break;
      }

      // Special cases
      if (req.path.includes('/login')) action = ActivityAction.LOGIN;
      if (req.path.includes('/logout')) action = ActivityAction.LOGOUT;

      // Extract entityId if present in path (e.g., /patients/:id)
      let entityId: string | undefined;
      // Basic heuristic: check if the last segment is an ObjectId-like string
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (lastSegment && /^[0-9a-fA-F]{24}$/.test(lastSegment)) {
        entityId = lastSegment;
      }

      // Fire and forget logging
      activityLogService.logActivity({
        userId: (req as any).user?._id,
        userRole: (req as any).user?.role,
        action,
        entity,
        entityId,
        details: {
          path: req.originalUrl,
          method: req.method,
          body: req.body,
          // Only log response on error for debugging, to avoid giant DB rows
          errorResponse: !isSuccess ? body : undefined 
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        status: isSuccess ? ActivityStatus.SUCCESS : ActivityStatus.FAILURE
      });

      // Call original send
      return originalSend.call(this, body);
    };
  }

  next();
};
