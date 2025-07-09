import { SESClient, SendEmailCommand, type SESClientConfig } from '@aws-sdk/client-ses';

type SendVerificationEmailParams = {
  destinationEmail: string;
  domainName: string;
  stage: string;
  token: string;
  sesClient?: Pick<SESClient, 'send'> | SESClientConfig;
};

export const sendVerificationEmail = async ({
  destinationEmail,
  domainName,
  sesClient,
  stage,
  token,
}: SendVerificationEmailParams): Promise<string> => {
  const verificationLink = `https://${domainName}/${stage}/api/verify-email?token=${token}`;
  const client = !!sesClient && 'send' in sesClient ? sesClient : new SESClient(sesClient || {});

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Instead of sending an email, we are logging the verification link. Please append this to your baseUrl: /api/verify-email?token=${token}`,
    );

    return 'mock-message-id-for-development';
  } else {
    const result = await client.send(
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
      throw new Error(
        "SendEmail never returns an undefined MessageId, it'd throw an error instead",
      );
    return MessageId;
  }
};
