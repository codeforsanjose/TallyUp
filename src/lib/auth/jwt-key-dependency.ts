import {
  SecretsManagerClient,
  type SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import { createDependency } from '../lambda-utils';
import { createSecretsManagerClient, getSecretValue } from '../secrets';

export type RawJwtKeyDependency = Awaited<
  ReturnType<ReturnType<typeof jwtKeyDependency>['strategy']>
>;

export const jwtKeyDependency = (client?: SecretsManagerClient | SecretsManagerClientConfig) =>
  createDependency(
    async (env) => {
      const jwtArn = env['JWT_SECRET_ARN'];
      if (!jwtArn)
        throw new Error(
          "JWT_SECRET_ARN is not defined in environment variables, but this should've been caught by cleanEnv",
        );

      const secretsManagerClient =
        client instanceof SecretsManagerClient ? client : createSecretsManagerClient(client);

      const secretValue = await getSecretValue(secretsManagerClient, jwtArn);

      return {
        jwtKey: secretValue,
      };
    },
    ['JWT_SECRET_ARN'] as const,
  );
