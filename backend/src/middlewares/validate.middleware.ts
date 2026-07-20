import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { ApiError } from '../errors/ApiError';

export const validate = (schema: ZodObject<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((err: any) => `${err.path.join('.')} - ${err.message}`).join(', ');
      return next(new ApiError(400, `Validation Error: ${messages}`));
    }
    return next(error);
  }
};
