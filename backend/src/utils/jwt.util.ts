import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'secret';
  const expiresIn = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any;
  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any;
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_ACCESS_SECRET || 'secret';
  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  return jwt.verify(token, secret) as TokenPayload;
};

export const generateRandomTokenString = (): string => {
  return crypto.randomBytes(40).toString('hex');
};
