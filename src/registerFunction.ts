import { hash } from '@node-rs/argon2';
import { buildHttpHandler, envDependencyStrategy, type Action, type EnvDependency } from './lib';
import { signJwtToken } from './lib/auth';
import { withDrizzle, type DrizzleDep } from './lib/db';
import { sendVerificationEmail, withEmail, type EmailDep } from './lib/email';
import { AuthRequestModel, type AuthRequest, type RegisterResponse } from './lib/openapi';

type RegisterEnv = {
  JWT_KEY: string;
};

type RegisterDeps = DrizzleDep & EnvDependency<RegisterEnv> & EmailDep;

const register: Action<AuthRequest, RegisterResponse, RegisterDeps> = async (
  data,
  deps,
  rawEvent,
) => {
  const { email, password } = data;
  const { drizzle, env, sesClient } = deps;

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
  const verifyEmailToken = signJwtToken({ expiresIn: '15m', userId, jwtKey: env.JWT_KEY });
  const webHost = rawEvent.headers['x-forwarded-host'] || rawEvent.headers['host'];
  const verifyEmailUrl = `https://${webHost}/verify-email?token=${verifyEmailToken}`;
  const result = await sendVerificationEmail({
    destinationEmail: email,
    sesClient,
    verificationLink: verifyEmailUrl,
    tallyUpSourceEmail: 'opensourcesanjose@gmail.com', // TODO: Do not hardcode this
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

export const handler = buildHttpHandler<AuthRequest, RegisterResponse, RegisterDeps>(
  AuthRequestModel,
  register,
  [
    withDrizzle(envDependencyStrategy(['SECRET_DB_URL'], process.env)),
    envDependencyStrategy<RegisterEnv>(['JWT_KEY'], process.env),
    withEmail(),
  ],
);
