import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { Result } from '../types';

type SendVerificationEmailParams = {
  sesClient: SESClient;
  tallyUpSourceEmail: string;
  destinationEmail: string;
  verificationLink: string;
};

export const sendVerificationEmail = async ({
  sesClient,
  tallyUpSourceEmail,
  destinationEmail,
  verificationLink,
}: SendVerificationEmailParams): Promise<Result<{ messageId: string }>> => {
  const result = await sesClient.send(
    new SendEmailCommand({
      Source: tallyUpSourceEmail,
      Destination: {
        ToAddresses: [destinationEmail],
      },
      Message: {
        Subject: {
          Data: 'Please verify your email address',
        },
        Body: {
          Text: {
            Data: `Please click the following link to verify your email address: ${verificationLink}`,
          },
        },
      },
    }),
  );

  const { MessageId } = result;
  if (!MessageId) return { success: false, error: new Error('Failed to send verification email') };
  return { success: true, data: { messageId: MessageId } };
};
