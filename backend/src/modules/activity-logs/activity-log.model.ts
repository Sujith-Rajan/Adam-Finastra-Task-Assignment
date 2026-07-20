import mongoose, { Document, Schema } from 'mongoose';

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  OTHER = 'OTHER'
}

export enum ActivityStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export interface IActivityLog extends Document {
  user?: mongoose.Types.ObjectId;
  userRole?: string;
  action: string;
  entity?: string;
  entityId?: mongoose.Types.ObjectId;
  details?: any;
  ipAddress?: string;
  status: ActivityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // E.g., failed logins might not have a resolved user ID
    },
    userRole: {
      type: String,
      required: false,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: false,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    details: {
      type: Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(ActivityStatus),
      default: ActivityStatus.SUCCESS,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries (pagination + filters)
activityLogSchema.index({ userRole: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
