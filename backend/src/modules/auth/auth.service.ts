import { User, Role } from '../users/user.model';
import { RefreshToken } from './refresh-token.model';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { generateAccessToken, generateRefreshToken, generateRandomTokenString } from '../../utils/jwt.util';
import { ApiError } from '../../errors/ApiError';
import crypto from 'crypto';

export class AuthService {

  async signupSuperAdmin(data: any, ipAddress: string) {
    const existingAdmin = await User.findOne({ role: Role.SUPER_ADMIN });
    if (existingAdmin) {
      throw new ApiError(400, 'Super Admin already exists');
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(400, 'Email is already taken');
    }

    const passwordHash = await hashPassword(data.password);
    const user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: Role.SUPER_ADMIN,
    });
    await user.save();

    return this.generateAuthTokens(user.id, user.role, ipAddress);
  }

  async login(email: string, password: string, ipAddress: string) {
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    return this.generateAuthTokens(user.id, user.role, ipAddress);
  }

  async refreshToken(token: string, ipAddress: string) {
    const refreshToken = await RefreshToken.findOne({ token }).populate('user');

    if (!refreshToken || !refreshToken.user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (refreshToken.revoked || refreshToken.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token expired or revoked. Please login again.');
    }

    // Revoke old token and create new one (Refresh Token Rotation)
    refreshToken.revoked = true;
    refreshToken.replacedByToken = generateRandomTokenString();
    await refreshToken.save();

    const newRefreshTokenStr = refreshToken.replacedByToken;
    const user = refreshToken.user as any;

    const newRefreshToken = new RefreshToken({
      user: user.id,
      token: newRefreshTokenStr,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdByIp: ipAddress,
    });
    await newRefreshToken.save();

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      accessToken,
      refreshToken: newRefreshTokenStr,
    };
  }

  async logout(token: string) {
    await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
  }

  private async generateAuthTokens(userId: string, role: string, ipAddress: string) {
    const accessToken = generateAccessToken({ userId, role });

    // Instead of using JWT for refresh token in DB, we store a secure random string
    // as per best practices for refresh token rotation in MongoDB.
    const refreshTokenStr = generateRandomTokenString();

    const refreshToken = new RefreshToken({
      user: userId,
      token: refreshTokenStr,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdByIp: ipAddress,
    });
    await refreshToken.save();

    const user = await User.findById(userId).select('-passwordHash');

    return {
      user: {
        id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        role: user?.role,
        permissions: (user as any)?.permissions,
      },
      accessToken,
      refreshToken: refreshTokenStr,
    };
  }
}

export const authService = new AuthService();
