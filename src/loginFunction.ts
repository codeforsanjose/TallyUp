import { verify } from '@node-rs/argon2';
import { signJwtToken } from './lib/auth';
import { jwtKeyDependency, type RawJwtKeyDependency } from './lib/auth/jwt-key-dependency';
import { createSession, drizzleDependency, type RawDrizzleDependency } from './lib/db';
import { buildHttpHandler, type Action } from './lib/lambda-utils';
import { AuthRequestModel, type AuthRequest, type LoginResponse } from './lib/openapi';
import { createSecretsManagerClient } from './lib/secrets';

type LoginDependencies = RawDrizzleDependency & RawJwtKeyDependency;

const login: Action<AuthRequest, LoginResponse, LoginDependencies> = async (
  { email, password },
  { drizzle, jwtKey },
) => {
  // Get user by email
  const user = await drizzle.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
    columns: {
      id: true,
      passwordHash: true,
      status: true,
    },
  });
  if (!user) return { success: false, error: new Error('User not found') };
  const { id: userId, passwordHash, status } = user;
  if (status !== 'active') return { success: false, error: new Error('User is not active') };

  // Verify password
  const isPasswordValid = await verify(passwordHash, password, {
    algorithm: 2,
    memoryCost: 65536, // 64 MB
    timeCost: 4, // 4 iterations
    parallelism: 1, // 1 thread
  });
  if (!isPasswordValid) {
    return { success: false, error: new Error('Invalid email or password') };
  }

  // Create session
  const refreshToken = signJwtToken({ userId, jwtKey });
  const { sessionId } = await createSession(drizzle, userId, refreshToken);

  return {
    success: true,
    data: {
      message: 'Login successful',
      refreshToken,
      sessionId,
    },
  };
};

const client = createSecretsManagerClient();
export const handler = buildHttpHandler({
  requestModel: AuthRequestModel,
  action: login,
  dependencies: [jwtKeyDependency(client), drizzleDependency(client)],
});
