import { verify } from '@node-rs/argon2';
import { and, desc, eq, inArray, not } from 'drizzle-orm';
import assert from 'node:assert';
import type { BaseResponseModel, LoginResponseModel } from './gen/zod/schemas.ts';
import { postLoginBody } from './gen/zod/tally-up-api';
import { getJwtKey } from './lib/auth/get-jwt-key';
import { signAccessToken } from './lib/auth/tokens.ts';
import type { AuthenticatedUser } from './lib/auth/types.ts';
import { getDbClient } from './lib/db';
import { buildHttpHandlerV2, type ActionResult } from './lib/lambda-utils/build-http-handler-v2';
import {
  defineGetDependenciesFn,
  mergeDependencies,
  type DependencyOf,
} from './lib/lambda-utils/build-http-handler-v2/dependencies';
import { parseEventDependency } from './lib/lambda-utils/build-http-handler-v2/parse-event-dependency';
import { fakeGetSecretValue, getSecretValue } from './lib/secrets';

const loginDeps = mergeDependencies(
  parseEventDependency({
    body: postLoginBody,
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

/** Action to handle user login */
const loginAction = async (
  deps: DependencyOf<typeof loginDeps>,
): Promise<ActionResult<LoginResponseModel | BaseResponseModel>> => {
  // Get dependencies
  const { parsedEvent, client, jwtKey } = deps;
  if (!parsedEvent.success) {
    return {
      statusCode: 400,
      body: { message: parsedEvent.error.message },
    };
  }
  const {
    body: { email, password },
  } = parsedEvent.data;

  // Get User by email
  const users = client._.fullSchema.users;
  const user = await client.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    return {
      statusCode: 401,
      body: { message: 'Invalid email or password' },
    };
  }
  if (user.status !== 'active') {
    return {
      statusCode: 403,
      body: { message: 'User is not active' },
    };
  }

  // Verify password
  const isPasswordValid = await verify(user.passwordHash, password);
  if (!isPasswordValid) {
    return {
      statusCode: 401,
      body: { message: 'Invalid email or password' },
    };
  }

  // Database interaction
  const sessions = client._.fullSchema.sessions;
  const { newSessionId } = await client.transaction(async (tx) => {
    // Create a new session
    const result = await tx
      .insert(sessions)
      .values({
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .returning({ id: sessions.id });
    const [newSession] = result;
    assert(newSession, "New session should've been created");

    // Mark all active sessions as revoked except 5
    await tx
      .update(sessions)
      .set({ revoked: true })
      .where(
        and(
          eq(sessions.userId, user.id),
          not(
            inArray(
              sessions.id,
              tx
                .select({ id: sessions.id })
                .from(sessions)
                .where(eq(sessions.userId, user.id))
                .orderBy(desc(sessions.createdAt))
                .limit(5),
            ),
          ),
        ),
      );
    return { newSessionId: newSession.id };
  });
  if (!newSessionId) {
    return {
      statusCode: 500,
      body: { message: 'Failed to create a new session' },
    };
  }

  // Sign access token
  const accessToken = await signAccessToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    } as AuthenticatedUser,
    jwtKey,
  );

  return {
    statusCode: 200,
    body: {
      accessToken,
      message: 'Login successful',
      refreshToken: newSessionId,
    },
  };
};

export const handler = buildHttpHandlerV2({
  getDependencies: loginDeps,
  action: loginAction,
});
