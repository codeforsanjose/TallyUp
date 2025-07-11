import { and } from 'drizzle-orm';
import { jwtKeyDependency, signJwtToken, type RawJwtKeyDependency } from './lib/auth';
import { drizzleDependency, type RawDrizzleDependency } from './lib/db';
import { sendVerificationEmail } from './lib/email';
import { buildHttpHandler, type Action } from './lib/lambda-utils';
import {
  ResendVerificationEmailRequestModel,
  type ResendVerificationEmailRequest,
  type ResendVerificationEmailResponse,
} from './lib/openapi';
import { createSecretsManagerClient } from './lib/secrets';

type ResendVerificationEmailDeps = RawDrizzleDependency & RawJwtKeyDependency;

export const resendVerificationEmail: Action<
  ResendVerificationEmailRequest,
  ResendVerificationEmailResponse,
  ResendVerificationEmailDeps
> = async ({ email }, { drizzle, jwtKey }, rawEvent) => {
  // Verify user exists
  const user = await drizzle.query.users.findFirst({
    where: (users, { eq }) => and(eq(users.email, email), eq(users.status, 'pending')),
    columns: {
      email: true,
    },
  });
  if (!user) return { success: false, error: new Error('User not found') };

  // Send verification email
  const verificationToken = signJwtToken({ userId: email, jwtKey });
  const { domainName, stage } = rawEvent.requestContext;
  const messageId = await sendVerificationEmail({
    destinationEmail: user.email,
    domainName,
    stage,
    token: verificationToken,
  });

  // Return success response
  return {
    success: true,
    data: {
      message: 'Verification email sent successfully',
      messageId,
    },
  };
};

const client = createSecretsManagerClient();
export const handler = buildHttpHandler({
  requestModel: ResendVerificationEmailRequestModel,
  action: resendVerificationEmail,
  dependencies: [drizzleDependency(client), jwtKeyDependency(client)],
});
