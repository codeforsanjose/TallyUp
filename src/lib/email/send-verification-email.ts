import { SESClient, SendEmailCommand, type SESClientConfig } from '@aws-sdk/client-ses';
import type { Result } from '../types';

type SendVerificationEmailParams = {
  destinationEmail: string;
  domainName: string;
  stage: string;
  tallyUpSourceEmail: string;
  token: string;
  sesClient?: SESClient | SESClientConfig;
};

export const sendVerificationEmail = async ({
  destinationEmail,
  domainName,
  sesClient,
  stage,
  tallyUpSourceEmail,
  token,
}: SendVerificationEmailParams): Promise<Result<{ messageId: string }>> => {
  const verificationLink = `https://${domainName}/${stage}/api/verify-email?token=${token}`;
  const client = sesClient instanceof SESClient ? sesClient : new SESClient(sesClient || {});

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Instead of sending an email, we are logging the verification link: ${verificationLink}`,
    );

    return { success: true, data: { messageId: 'mock-message-id-for-dev' } };
  } else {
    const result = await client.send(
      new SendEmailCommand({
        Source: tallyUpSourceEmail,
        Destination: {
          ToAddresses: [destinationEmail],
        },
        Message: {
          Subject: {
            Data: 'Your TallyUp Verification Link',
          },
          Body: {
            Text: {
              Data: `Thank you for creating an account with TallyUp. Please click the following link to verify your email address: ${verificationLink}`,
            },
          },
        },
      }),
    );
    const { MessageId } = result;
    if (!MessageId)
      return { success: false, error: new Error('Failed to send verification email') };
    return { success: true, data: { messageId: MessageId } };
  }
};
