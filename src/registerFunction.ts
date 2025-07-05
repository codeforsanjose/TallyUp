// import { hash } from '@node-rs/argon2';
import { signJwtToken } from './lib/auth';
import { jwtKeyDependency, type RawJwtKeyDependency } from './lib/auth/jwt-key-dependency';
import { drizzleDependency, type RawDrizzleDependency } from './lib/db';
import { sendVerificationEmail } from './lib/email';
import { buildHttpHandler, type Action } from './lib/lambda-utils';
import { AuthRequestModel, type AuthRequest, type RegisterResponse } from './lib/openapi';
import { hash } from '@node-rs/argon2';
import { createSecretsManagerClient } from './lib/secrets';

type RegisterDeps = RawDrizzleDependency & RawJwtKeyDependency;

const register: Action<AuthRequest, RegisterResponse, RegisterDeps> = async (
  { email, password },
  { drizzle, jwtKey },
  rawEvent,
) => {
  // Hash password
  const passwordHash = await hash(password, {
    algorithm: 2,
    memoryCost: 65536, // 64 MB
    timeCost: 4, // 4 iterations
    parallelism: 1, // 1 thread
  });

  // Insert user into the database
  const { users } = drizzle._.fullSchema;
  const query = await drizzle
    .insert(users)
    .values({ email, passwordHash, status: 'pending' })
    .onConflictDoNothing()
    .returning({ id: users.id });
  const userId = query[0]?.id;
  if (!userId) return { success: false, error: new Error('Failed to create user') };

  // Send verification email
  const verifyEmailToken = signJwtToken({ expiresIn: '15m', userId, jwtKey });
  const { domainName, stage } = rawEvent.requestContext;
  const result = await sendVerificationEmail({
    destinationEmail: email,
    domainName,
    stage,
    token: verifyEmailToken,
  });
  if (!result.success) return { success: false, error: result.error };

  // Return success response
  return {
    success: true,
    data: {
      userId,
      message: 'User registered successfully. Please check your email to verify your account.',
    },
  };
};

const client = createSecretsManagerClient();
export const handler = buildHttpHandler({
  requestModel: AuthRequestModel,
  action: register,
  dependencies: [drizzleDependency(client), jwtKeyDependency(client)],
});
