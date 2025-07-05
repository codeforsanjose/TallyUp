import { and, eq } from 'drizzle-orm';
import {
  jwtKeyDependency,
  signJwtToken,
  verifyJwtToken,
  type RawJwtKeyDependency,
} from './lib/auth';
import { drizzleDependency, type RawDrizzleDependency } from './lib/db';
import { buildHttpHandler, type Action } from './lib/lambda-utils';
import {
  RefreshTokenRequestModel,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
} from './lib/openapi';
import { createSecretsManagerClient } from './lib/secrets';

type RefreshTokenDeps = RawDrizzleDependency & RawJwtKeyDependency;

export const refreshTokenFunction: Action<
  RefreshTokenRequest,
  RefreshTokenResponse,
  RefreshTokenDeps
> = async ({ refreshToken, sessionId }, { drizzle, jwtKey }) => {
  // Verify the refresh token
  const verifyResult = await verifyJwtToken(refreshToken, jwtKey);
  if (!verifyResult.success) return { success: false, error: verifyResult.error };
  const { userId } = verifyResult.data;

  // Update the session with a new refresh token
  const sessionsTable = drizzle._.fullSchema.sessions;
  const newRefreshToken = signJwtToken({ userId, jwtKey });
  const updateResult = await drizzle
    .update(sessionsTable)
    .set({ nextRefreshToken: newRefreshToken, lastAccessed: new Date().toISOString() })
    .where(and(eq(sessionsTable.userId, userId), eq(sessionsTable.id, sessionId)));
  if (updateResult.rowCount === 0)
    return {
      success: false,
      error: new Error(`Session "${sessionId}" not found or not owned by user "${userId}"`),
    };

  // Generate an access token
  const accessToken = signJwtToken({
    userId,
    jwtKey,
    expiresIn: '1h',
    refreshToken,
  });

  return {
    success: true,
    data: {
      message: 'Refresh token updated successfully',
      refreshToken: newRefreshToken,
      accessToken,
    },
  };
};

const secrets = createSecretsManagerClient();
export const handler = buildHttpHandler({
  requestModel: RefreshTokenRequestModel,
  action: refreshTokenFunction,
  dependencies: [jwtKeyDependency(secrets), drizzleDependency(secrets)],
});
