import { Request, Response, NextFunction } from 'express';
import { ApiError } from './ApiError';
import { sendResponse } from '../responses/apiResponse';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const { statusCode, message } = error;

  sendResponse(
    res,
    statusCode,
    false,
    message,
    null,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};
