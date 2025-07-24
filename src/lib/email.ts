import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

type SendVerificationEmailParams = {
  destinationEmail: string;
  token: string;
  event: APIGatewayProxyEventV2;
};

export const buildGetSesClient = (): (() => SESClient) => {
  let sesClient: SESClient | undefined;
  return () => {
    if (!sesClient) {
      sesClient = new SESClient();
    }
    return sesClient;
  };
};

export const getSesClient = buildGetSesClient();

export const sendVerificationEmail = async ({
  destinationEmail,
  token,
  event,
}: SendVerificationEmailParams): Promise<string> => {
  const verificationLink = `https://${event.requestContext.domainName}/api/verify-email?token=${token}`;

  const result = await getSesClient().send(
    new SendEmailCommand({
      Source: 'tallyup@mail.opensourcesanjose.org',
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
    throw new Error("SendEmail never returns an undefined MessageId, it'd throw an error instead");
  return MessageId;
};

export const fakeSendVerificationEmail = async ({
  token,
}: SendVerificationEmailParams): Promise<string> => {
  console.log(
    `Instead of sending an email, we are logging the verification link. Please append this to your baseUrl: /api/verify-email?token=${token}`,
  );
  return 'mock-message-id-for-development';
};
