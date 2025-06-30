import jwt from 'jsonwebtoken';
import type { Result } from '../types';

export const verifyJwtToken = async (
  token: string,
  jwtKey: string,
  verifyOptions?: jwt.VerifyOptions,
): Promise<Result<{ userId: number }>> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtKey, { complete: true, ...verifyOptions }, (err, decoded) => {
      if (err) resolve({ success: false, error: err });
      else if (typeof decoded === 'string') {
        resolve({
          success: false,
          error: new Error(`Decoded token is a string, expected an object: ${decoded}`),
        });
      } else if (typeof decoded === 'object' && 'userId' in decoded) {
        const { userId } = decoded;
        if (typeof userId !== 'number')
          resolve({
            success: false,
            error: new Error(`Decoded token userId is not a number: ${userId}`),
          });

        resolve({ success: true, data: { userId } });
      } else {
        reject(new Error(`Decoded token is malformed: ${JSON.stringify(decoded)}`));
      }
    });
  });
};
