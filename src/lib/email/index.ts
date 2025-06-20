import { SESClient } from '@aws-sdk/client-ses';
import type { DepStrategy } from '../lambda-utils/build-http-handler';

export type EmailDep = {
  sesClient: SESClient;
};

export const withEmail =
  (_params?: object): DepStrategy<EmailDep> =>
  async () => {
    return { sesClient: new SESClient({}) };
  };

export * from './send-verification-email';
