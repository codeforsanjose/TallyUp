import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { createDependency } from '../lambda-utils';
import { getSecretValue } from '../secrets';

export type RawJwtKeyDependency = Awaited<
  ReturnType<ReturnType<typeof jwtKeyDependency>['strategy']>
>;

export const jwtKeyDependency = (client: Pick<SecretsManagerClient, 'send'>) =>
  createDependency(
    async (env) => {
      if (process.env.NODE_ENV !== 'production') {
        return {
          jwtKey: 'oof-ouch-owie',
        };
      }

      // NODE_ENV is production
      const jwtArn = env['JWT_SECRET_ARN'];
      if (!jwtArn)
        throw new Error(
          "JWT_SECRET_ARN is not defined in environment variables, but this should've been caught by cleanEnv",
        );

      const secretValue = await getSecretValue(client, jwtArn);

      return {
        jwtKey: secretValue,
      };
    },
    ['JWT_SECRET_ARN'] as const,
  );
