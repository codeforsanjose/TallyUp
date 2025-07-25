import type { BaseResponseModel } from '../../gen/zod/schemas.ts';
import type { ActionResult } from '../lambda-utils/build-http-handler-v2';
import { defineGetDependenciesFn } from '../lambda-utils/build-http-handler-v2/dependencies';
import { verifyAccessToken } from './tokens';
import type { AuthenticatedUser } from './types';

export const authDependency = (allowedRoles: ('admin' | 'volunteer' | 'staff')[]) =>
  defineGetDependenciesFn(async (event) => {
    return {
      verifyAccessToken: async (
        jwtKey: string,
      ): Promise<AuthenticatedUser | ActionResult<BaseResponseModel>> => {
        const authorizationHeader = (
          event.headers['Authorization'] || event.headers['authorization']
        )?.split(' ')[1];
        if (!authorizationHeader) {
          console.error('Authorization header is missing');
          return { body: { message: 'Authorization header is missing' }, statusCode: 401 };
        }
        const verifyResult = verifyAccessToken(authorizationHeader, jwtKey);
        if (!verifyResult.success) {
          console.error(`Token verification failed: ${verifyResult.error.message}`);
          return { body: { message: verifyResult.error.message }, statusCode: 401 };
        }

        if (!allowedRoles.includes(verifyResult.data.role)) {
          console.error(`User does not have the required role: ${allowedRoles.join(', ')}`);
          return {
            body: { message: 'User does not have the required role' },
            statusCode: 403,
          };
        }
        return verifyResult.data;
      },
    };
  });
