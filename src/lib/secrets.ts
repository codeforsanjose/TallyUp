import {
  GetSecretValueCommand,
  SecretsManagerClient,
  type SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';

export const createSecretsManagerClient = (
  cfgOverrides?: SecretsManagerClientConfig,
): SecretsManagerClient => {
  return new SecretsManagerClient({
    ...cfgOverrides,
  });
};

export type GetSecretValueFn = typeof getSecretValue;

export const getSecretValue = async (
  client: Pick<SecretsManagerClient, 'send'>,
  secretId: string,
): Promise<string> => {
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) throw new Error('No SecretString when calling getSecretValue');
  return response.SecretString;
};
