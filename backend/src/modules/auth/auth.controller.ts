import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendResponse } from '../../responses/apiResponse';

const setTokenCookie = (res: Response, token: string) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };
  res.cookie('refreshToken', token, cookieOptions);
};

export const signupSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const { user, accessToken, refreshToken } = await authService.signupSuperAdmin(req.body, ipAddress);
    
    setTokenCookie(res, refreshToken);
    
    sendResponse(res, 201, true, 'Super Admin created successfully', { user, accessToken });
  } catch (error) {
    next(error);
  }
};

const DEFAULT_MENUS = {
  SUPER_ADMIN: ["Dashboard", "Doctors", "Receptionists", "Schedules", "Appointments", "Patients", "Master Data", "Activity Logs"],
  RECEPTIONIST: ["Dashboard", "Patients", "Appointments", "Schedules"],
  DOCTOR: ["Dashboard", "My Appointments", "My Patients"],
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    
    const { user, accessToken, refreshToken } = await authService.login(email, password, ipAddress);
    
    // Attach user to req so the activity logger middleware can capture who logged in
    (req as any).user = user;

    setTokenCookie(res, refreshToken);
    
    const menus = (user.permissions && user.permissions.length > 0) 
      ? user.permissions 
      : DEFAULT_MENUS[user.role as keyof typeof DEFAULT_MENUS] || [];

    const userWithMenus = { ...user, menus };
    
    sendResponse(res, 200, true, 'Login successful', { user: userWithMenus, accessToken });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(token, ipAddress);
    
    setTokenCookie(res, newRefreshToken);
    
    sendResponse(res, 200, true, 'Token refreshed successfully', { user, accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    
    res.clearCookie('refreshToken');
    sendResponse(res, 200, true, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};
