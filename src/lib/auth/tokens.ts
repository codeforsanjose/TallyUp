import assert from 'assert';
import { sign, verify } from 'jsonwebtoken';
import type { Result } from '../types';
import type { AuthenticatedUser } from './types';

export const signAccessToken = async (user: AuthenticatedUser, jwtKey: string): Promise<string> => {
  return sign({ ...user, type: 'access' }, jwtKey, {
    subject: user.userId,
    expiresIn: '1h',
  });
};

export const verifyAccessToken = (token: string, jwtKey: string): Result<AuthenticatedUser> => {
  try {
    const decoded = verify(token, jwtKey) as AuthenticatedUser & { type: string };
    if (decoded.type !== 'access') {
      return {
        success: false,
        error: new Error('Invalid token type'),
      };
    }
    return { success: true, data: decoded };
  } catch (error) {
    assert(error instanceof Error, 'Error must be an instance of Error');
    console.error(`Token verification failed: ${error}`);
    return {
      success: false,
      error: new Error(`Invalid or expired access token`),
    };
  }
};

export const signVerificationToken = async (params: {
  userId: string;
  jwtKey: string;
}): Promise<string> => {
  const { userId, jwtKey } = params;
  return sign({ userId, type: 'verification' }, jwtKey, {
    subject: userId,
    expiresIn: '15m',
  });
};

export const verifyVerificationToken = (params: {
  token: string;
  jwtKey: string;
}): Result<{ userId: string }> => {
  const { token, jwtKey } = params;
  try {
    const decoded = verify(token, jwtKey) as { userId: string; type: string };
    if (decoded.type !== 'verification') {
      return {
        success: false,
        error: new Error('Invalid token type'),
      };
    }
    return { success: true, data: { userId: decoded.userId } };
  } catch (error) {
    assert(error instanceof Error, 'Error must be an instance of Error');
    return {
      success: false,
      error: new Error(`Invalid or expired verification token: ${error.message}`),
    };
  }
};
