import { and, eq } from 'drizzle-orm';
import assert from 'node:assert';
import {
  jwtKeyDependency,
  signJwtToken,
  verifyJwtToken,
  type RawJwtKeyDependency,
} from './lib/auth';
import { createSession, drizzleDependency, type RawDrizzleDependency } from './lib/db';
import {
  VerifyEmailRequestModel,
  type VerifyEmailRequest,
  type VerifyEmailResponse,
} from './lib/openapi';
import { buildHttpHandler, type Action } from './lib/lambda-utils';
import { createSecretsManagerClient } from './lib/secrets';

type VerifyEmailDeps = RawDrizzleDependency & RawJwtKeyDependency;

export const verifyEmail: Action<VerifyEmailRequest, VerifyEmailResponse, VerifyEmailDeps> = async (
  { token },
  { drizzle, jwtKey },
) => {
  // Verify jwt token
  const verifyResult = await verifyJwtToken(token, jwtKey);
  if (!verifyResult.success) return { success: false, error: verifyResult.error };
  const { userId } = verifyResult.data;

  // Update user status to active
  const usersTable = drizzle._.fullSchema.users;
  const updateResult = await drizzle
    .update(usersTable)
    .set({ status: 'active' })
    .where(and(eq(usersTable.id, userId), eq(usersTable.status, 'pending')))
    .returning({ id: usersTable.id });
  const updatedUserId = updateResult[0]?.id;
  if (!updatedUserId)
    return { success: false, error: new Error('User not found or already active') };
  assert(
    updateResult.length <= 1,
    `Somehow updated more than one user: ${JSON.stringify(updateResult)}`,
  );

  // Create session
  const refreshToken = signJwtToken({ userId: updatedUserId, jwtKey });
  const { sessionId } = await createSession({
    drizzle,
    userId: updatedUserId,
    nextRefreshToken: refreshToken,
  });
  return {
    success: true,
    data: {
      message: 'Email verified successfully',
      userId: updatedUserId,
      refreshToken,
      sessionId,
    },
  };
};

const client = createSecretsManagerClient();
export const handler = buildHttpHandler({
  requestModel: VerifyEmailRequestModel,
  action: verifyEmail,
  dependencies: [drizzleDependency(client), jwtKeyDependency(client)],
});
