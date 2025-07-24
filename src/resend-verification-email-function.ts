// import { and } from 'drizzle-orm';
// import type { BaseResponseModel, GetResendVerificationEmailParams } from './gen/zod/schemas.ts';
// import { getResendVerificationEmailQueryParams } from './gen/zod/tally-up-api.ts';
// import { jwtKeyDependency, signJwtToken, type RawJwtKeyDependency } from './lib/auth';
// import { drizzleDependency, type RawDrizzleDependency } from './lib/db';
// import { sendVerificationEmail } from './lib/email';
// import { buildHttpHandler, type Action } from './lib/lambda-utils';
// import { getSecretsManagerClient } from './lib/secrets';

// type ResendVerificationEmailDeps = RawDrizzleDependency & RawJwtKeyDependency;

// export const resendVerificationEmail: Action<
//   GetResendVerificationEmailParams,
//   BaseResponseModel,
//   ResendVerificationEmailDeps
// > = async ({ email }, { drizzle, jwtKey }, rawEvent) => {
//   // Verify user exists
//   const user = await drizzle.query.users.findFirst({
//     // @ts-ignore -- TODO: Fix type error in drizzle query
//     where: (users, { eq }) => and(eq(users.email, email), eq(users.status, 'pending')),
//     columns: {
//       email: true,
//     },
//   });
//   if (!user) return { success: false, error: new Error('User not found') };

//   // Send verification email
//   const verificationToken = signJwtToken({ userId: email, jwtKey });
//   const { domainName, stage } = rawEvent.requestContext;
//   const messageId = await sendVerificationEmail({
//     destinationEmail: user.email,
//     domainName,
//     stage,
//     token: verificationToken,
//   });

//   // Return success response
//   return {
//     success: true,
//     data: {
//       message: 'Verification email sent successfully',
//       messageId,
//     },
//   };
// };

// const client = getSecretsManagerClient();
// export const handler = buildHttpHandler({
//   requestModel: getResendVerificationEmailQueryParams,
//   action: resendVerificationEmail,
//   dependencies: [drizzleDependency(client), jwtKeyDependency(client)],
// });
