import { and, eq } from 'drizzle-orm';
import type { BaseResponseModel, VerifyEmailResponseModel } from './gen/zod/schemas.ts';
import { getVerifyEmailQueryParams } from './gen/zod/tally-up-api';
import { getJwtKey } from './lib/auth/get-jwt-key.ts';
import { verifyVerificationToken } from './lib/auth/tokens.ts';
import { getDbClient } from './lib/db/client.ts';
import { buildHttpHandlerV2, type ActionResult } from './lib/lambda-utils/build-http-handler-v2';
import {
  defineGetDependenciesFn,
  mergeDependencies,
  type DependencyOf,
} from './lib/lambda-utils/build-http-handler-v2/dependencies';
import { parseEventDependency } from './lib/lambda-utils/build-http-handler-v2/parse-event-dependency';
import { fakeGetSecretValue, getSecretValue } from './lib/secrets.ts';
import type { Result } from './lib/types.ts';

const verifyEmailDeps = mergeDependencies(
  parseEventDependency({
    query: getVerifyEmailQueryParams,
  }),
  defineGetDependenciesFn(async () => {
    const { DB_URL_SECRET_ARN, JWT_SECRET_ARN } = process.env;
    if (!JWT_SECRET_ARN || !DB_URL_SECRET_ARN) {
      throw new Error(
        'JWT_SECRET_ARN or DB_URL_SECRET_ARN is not defined in environment variables',
      );
    }

    const client = await getDbClient({
      dbSecretArn: DB_URL_SECRET_ARN,
      getSecretValue: process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
    });

    return {
      decodeVerificationToken: async (token: string) => {
        const jwtKey = await getJwtKey({
          jwtSecretArn: JWT_SECRET_ARN,
          getSecretValue:
            process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
        });
        return verifyVerificationToken({ token, jwtKey });
      },

      updateUserStatusToActive: async (userId: string): Promise<Result<{ userId: string }>> => {
        const updateResult = await client
          .update(client._.fullSchema.users)
          .set({ status: 'active' })
          .where(
            and(
              eq(client._.fullSchema.users.id, userId),
              eq(client._.fullSchema.users.status, 'pending'),
            ),
          )
          .returning({ id: client._.fullSchema.users.id });
        const user = updateResult[0];

        if (!user) {
          return {
            success: false,
            error: new Error('User not found or already active'),
          };
        }

        return {
          success: true,
          data: { userId: user.id },
        };
      },
    };
  }),
);

const verifyEmailAction = async (
  deps: DependencyOf<typeof verifyEmailDeps>,
): Promise<ActionResult<VerifyEmailResponseModel | BaseResponseModel>> => {
  const { decodeVerificationToken, parsedEvent, updateUserStatusToActive } = deps;
  if (!parsedEvent.success) {
    return {
      statusCode: 400,
      body: { message: parsedEvent.error.message },
    };
  }
  const {
    query: { token },
  } = parsedEvent.data;

  // Verify the verification jwt
  const verifyResult = await decodeVerificationToken(token);
  if (!verifyResult.success) {
    return {
      statusCode: 400,
      body: { message: verifyResult.error.message },
    };
  }
  const { userId } = verifyResult.data;

  // Update user status to active
  const updateResult = await updateUserStatusToActive(userId);
  if (!updateResult.success) {
    return {
      statusCode: 400,
      body: { message: updateResult.error.message },
    };
  }

  return {
    statusCode: 200,
    body: {
      message: 'Email verified successfully',
      userId: updateResult.data.userId,
    },
  };
};

export const handler = buildHttpHandlerV2({
  getDependencies: verifyEmailDeps,
  action: verifyEmailAction,
});
