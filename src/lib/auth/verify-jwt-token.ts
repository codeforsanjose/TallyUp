import jwt from 'jsonwebtoken';
import type { Result } from '../types';
import assert from 'assert';

export const verifyJwtToken = async (
  token: string,
  jwtKey: string,
): Promise<Result<{ userId: string }>> => {
  return new Promise((resolve) => {
    jwt.verify(token, jwtKey, { complete: true }, (err, decoded) => {
      if (err) resolve({ success: false, error: err });
      assert(
        decoded &&
          typeof decoded === 'object' &&
          'payload' in decoded &&
          'header' in decoded &&
          'signature' in decoded,
        'Decoded JWT should be an object with payload, header, and signature when complete is true',
      );
      const { payload } = decoded;
      if (typeof payload === 'string') {
        resolve({ success: false, error: new Error('Invalid JWT payload') });
        return;
      }

      const { userId } = payload;
      if (typeof userId !== 'string') {
        resolve({ success: false, error: new Error('Invalid userId in JWT payload') });
        return;
      }

      resolve({ success: true, data: { userId } });
    });
  });
};
