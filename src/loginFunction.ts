import { verifySync } from '@node-rs/argon2';
import { buildHttpHandler, envDependencyStrategy, type Action, type EnvDependency } from './lib';
import { signJwtToken } from './lib/auth';
import { withDrizzle, type DrizzleDep } from './lib/db';
import { AuthRequestModel, type AuthRequest, type LoginResponse } from './lib/openapi';

type LoginEnv = {
  RDS_SECRET_ARN: string;
  RDS_RESOURCE_ARN: string;
  JWT_SECRET_KEY: string;
};

const login: Action<AuthRequest, LoginResponse, DrizzleDep & EnvDependency<LoginEnv>> = async (
  data,
  { drizzle, env },
) => {
  const { email, password } = data;
  const { JWT_SECRET_KEY: jwtKey } = env;

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
  const isPasswordValid = verifySync(password, passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: new Error('Invalid email or password') };
  }

  const refreshToken = signJwtToken({ userId, jwtKey });
  return {
    success: true,
    data: {
      message: 'Login successful',
      refreshToken,
    },
  };
};

export const handler = buildHttpHandler(AuthRequestModel, login, [
  withDrizzle(envDependencyStrategy(['SECRET_DB_URL'], process.env)),
  envDependencyStrategy<LoginEnv>(
    ['JWT_SECRET_KEY', 'RDS_RESOURCE_ARN', 'RDS_SECRET_ARN'],
    process.env,
  ),
]);
