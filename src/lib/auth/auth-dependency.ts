import { defineGetDependenciesFn } from '../lambda-utils/build-http-handler-v2/dependencies';
import type { Result } from '../types';
import { verifyAccessToken } from './tokens';
import type { AuthenticatedUser } from './types';

export const authDependency = (allowedRoles: ('admin' | 'volunteer' | 'staff')[]) =>
  defineGetDependenciesFn(async (event) => {
    return {
      verifyAccessToken: async (jwtKey: string): Promise<Result<AuthenticatedUser>> => {
        const authorizationHeader = (
          event.headers['Authorization'] || event.headers['authorization']
        )?.split(' ')[1];
        if (!authorizationHeader) {
          console.error('Authorization header is missing');
          return { success: false, error: new Error('Authorization header is missing') };
        }
        const verifyResult = verifyAccessToken(authorizationHeader, jwtKey);
        if (!verifyResult.success) {
          console.error(`Token verification failed: ${verifyResult.error.message}`);
          return { success: false, error: verifyResult.error };
        }

        if (!allowedRoles.includes(verifyResult.data.role)) {
          console.error(`User does not have the required role: ${allowedRoles.join(', ')}`);
          return {
            success: false,
            error: new Error(`User does not have the required role: ${allowedRoles.join(', ')}`),
          };
        }
        return { success: true, data: verifyResult.data };
      },
    };
  });
