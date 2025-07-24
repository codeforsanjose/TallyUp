import { and, desc, eq, inArray, not } from 'drizzle-orm';
import assert from 'node:assert';
import type { BaseResponseModel, RefreshResponseModel } from './gen/zod/schemas.ts';
import { postRefreshBody } from './gen/zod/tally-up-api';
import { getJwtKey } from './lib/auth/get-jwt-key';
import { signAccessToken } from './lib/auth/tokens';
import { getDbClient } from './lib/db';
import { buildHttpHandlerV2, type ActionResult } from './lib/lambda-utils/build-http-handler-v2';
import {
  defineGetDependenciesFn,
  mergeDependencies,
  type DependencyOf,
} from './lib/lambda-utils/build-http-handler-v2/dependencies';
import { parseEventDependency } from './lib/lambda-utils/build-http-handler-v2/parse-event-dependency';
import { fakeGetSecretValue, getSecretValue } from './lib/secrets';

const refreshTokenDeps = mergeDependencies(
  parseEventDependency({
    body: postRefreshBody,
  }),
  defineGetDependenciesFn(async () => {
    const { DB_URL_SECRET_ARN, JWT_SECRET_ARN } = process.env;
    if (!DB_URL_SECRET_ARN || !JWT_SECRET_ARN) {
      throw new Error(
        'DB_URL_SECRET_ARN or JWT_SECRET_ARN is not defined in environment variables',
      );
    }
    return {
      client: await getDbClient({
        dbSecretArn: DB_URL_SECRET_ARN,
        getSecretValue: process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
      }),
      jwtKey: await getJwtKey({
        jwtSecretArn: JWT_SECRET_ARN,
        getSecretValue: process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
      }),
    };
  }),
);

const refreshTokenAction = async (
  deps: DependencyOf<typeof refreshTokenDeps>,
): Promise<ActionResult<RefreshResponseModel | BaseResponseModel>> => {
  // Get dependencies
  const { client, jwtKey, parsedEvent } = deps;
  if (!parsedEvent.success) {
    return {
      statusCode: 400,
      body: { message: parsedEvent.error.message },
    };
  }
  const { refreshToken } = parsedEvent.data.body;

  // Database interaction
  const sessions = client._.fullSchema.sessions;
  const { newSessionId, token, role, status } = await client.transaction(async (tx) => {
    // Mark the session as revoked
    const result = await tx
      .update(sessions)
      .set({ revoked: true })
      .where(eq(sessions.id, refreshToken))
      .returning({ id: sessions.id, userId: sessions.userId });
    const [token] = result;
    if (!token) return {};

    // Get the user of the session
    const user = await tx.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, token.userId),
      columns: { id: true, role: true, status: true },
    });
    if (!user) return {};

    // Create a new session
    const newSession = await tx
      .insert(sessions)
      .values({
        userId: token.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .returning({ id: sessions.id });
    const newSessionId = newSession[0]?.id;
    assert(newSessionId, "New session ID should've be defined");

    // Mark all active sessions as revoked except 5
    await tx
      .update(sessions)
      .set({ revoked: true })
      .where(
        and(
          eq(sessions.userId, token.userId),
          not(
            inArray(
              sessions.id,
              tx
                .select({ id: sessions.id })
                .from(sessions)
                .where(eq(sessions.userId, token.userId))
                .orderBy(desc(sessions.createdAt))
                .limit(5),
            ),
          ),
        ),
      );

    return { token, role: user.role, status: user.status, newSessionId };
  });
  if (!token) {
    return {
      statusCode: 401,
      body: { message: 'Invalid refresh token' },
    };
  }

  // Sign a new access token
  const accessToken = await signAccessToken({ role, status, userId: token.userId }, jwtKey);
  return {
    statusCode: 200,
    body: {
      accessToken,
      refreshToken: newSessionId,
      message: 'Refresh token successful',
    },
  };
};

export const handler = buildHttpHandlerV2({
  getDependencies: refreshTokenDeps,
  action: refreshTokenAction,
});
