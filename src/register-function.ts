import { hash } from '@node-rs/argon2';
import type { BaseResponseModel } from '../frontend/src/api';
import type { RegisterResponseModel } from './gen/zod/schemas.ts';
import { postRegisterBody } from './gen/zod/tally-up-api';
import { getJwtKey } from './lib/auth/get-jwt-key.ts';
import { signVerificationToken } from './lib/auth/tokens.ts';
import { getDbClient } from './lib/db';
import { fakeSendVerificationEmail, sendVerificationEmail } from './lib/email.ts';
import { buildHttpHandlerV2, type ActionResult } from './lib/lambda-utils/build-http-handler-v2';
import {
  defineGetDependenciesFn,
  mergeDependencies,
} from './lib/lambda-utils/build-http-handler-v2/dependencies';
import { parseEventDependency } from './lib/lambda-utils/build-http-handler-v2/parse-event-dependency';
import { fakeGetSecretValue, getSecretValue } from './lib/secrets.ts';

const registerDependencies = mergeDependencies(
  parseEventDependency({
    body: postRegisterBody,
  }),
  defineGetDependenciesFn(async (event) => {
    const { DB_URL_SECRET_ARN, JWT_SECRET_ARN } = process.env;
    if (!DB_URL_SECRET_ARN || !JWT_SECRET_ARN) {
      throw new Error(
        'DB_URL_SECRET_ARN or JWT_SECRET_ARN is not defined in environment variables',
      );
    }
    const client = await getDbClient({
      dbSecretArn: DB_URL_SECRET_ARN,
      getSecretValue: process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
    });

    return {
      insertUser: async (data: { email: string; passwordHash: string }) => {
        const result = await client
          .insert(client._.fullSchema.users)
          .values({
            email: data.email,
            passwordHash: data.passwordHash,
            status: 'pending',
            role: 'volunteer', // TODO: Make this configurable
          })
          .onConflictDoNothing()
          .returning({ id: client._.fullSchema.users.id });

        const user = result[0];
        if (!user) return;
        // Send verification email
        const token = await signVerificationToken({
          userId: user.id,
          jwtKey: await getJwtKey({
            jwtSecretArn: JWT_SECRET_ARN,
            getSecretValue:
              process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
          }),
        });
        await (
          process.env.NODE_ENV === 'production' ? sendVerificationEmail : fakeSendVerificationEmail
        )({
          destinationEmail: data.email,
          token,
          event,
        });

        return {
          userId: user.id,
        };
      },
    };
  }),
);

export const handler = buildHttpHandlerV2({
  getDependencies: registerDependencies,
  action: async (deps): Promise<ActionResult<RegisterResponseModel | BaseResponseModel>> => {
    const { parsedEvent, insertUser } = deps;
    if (!parsedEvent.success) {
      return {
        statusCode: 400,
        body: { message: parsedEvent.error.message },
      };
    }

    const { email, password } = parsedEvent.data.body;
    const passwordHash = await hash(password);
    const result = await insertUser({ email, passwordHash });
    if (!result) {
      return {
        statusCode: 409,
        body: { message: 'User with this email already exists.' },
      };
    }

    return {
      statusCode: 201,
      body: {
        message: 'User registered successfully. Please check your email to verify your account.',
        userId: result.userId,
      },
    };
  },
});
