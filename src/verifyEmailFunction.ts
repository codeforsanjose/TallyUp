import { eq } from 'drizzle-orm';
import { buildHttpHandler, envDependencyStrategy, type Action, type EnvDependency } from './lib';
import { signJwtToken, verifyJwtToken } from './lib/auth';
import { withDrizzle, type DrizzleDep } from './lib/db';
import {
  VerifyEmailRequestModel,
  type VerifyEmailRequest,
  type VerifyEmailResponse,
} from './lib/openapi';
import assert from 'node:assert';

type VerifyEmailEnv = {
  JWT_SECRET_KEY: string;
};

type VerifyEmailDeps = DrizzleDep & EnvDependency<VerifyEmailEnv>;

export const verifyEmail: Action<VerifyEmailRequest, VerifyEmailResponse, VerifyEmailDeps> = async (
  data,
  deps,
) => {
  const { token } = data;
  const { drizzle, env } = deps;

  // Verify jwt token
  const { JWT_SECRET_KEY: jwtKey } = env;
  const verifyResult = await verifyJwtToken(token, jwtKey);
  if (!verifyResult.success) return { success: false, error: verifyResult.error };
  const { userId } = verifyResult.data;

  // Update user status to active
  const usersTable = drizzle._.fullSchema.users;
  const updateResult = await drizzle
    .update(usersTable)
    .set({ status: 'active' })
    .where(eq(usersTable.id, userId))
    .returning({ id: usersTable.id });
  const updatedUserId = updateResult[0]?.id;
  if (!updatedUserId)
    return { success: false, error: new Error('User not found or already active') };
  assert(
    updateResult.length <= 1,
    `Somehow updated more than one user: ${JSON.stringify(updateResult)}`,
  );

  // Create refresh token
  const refreshToken = signJwtToken({ userId: updatedUserId, jwtKey });

  return {
    success: true,
    data: {
      message: 'Email verified successfully',
      userId: updatedUserId,
      refreshToken,
    },
  };
};

export const handler = buildHttpHandler(VerifyEmailRequestModel, verifyEmail, [
  withDrizzle(envDependencyStrategy(['SECRET_DB_URL'], process.env)),
  envDependencyStrategy<VerifyEmailEnv>(['JWT_SECRET_KEY'], process.env),
]);
