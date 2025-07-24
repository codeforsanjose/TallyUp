import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export const createSecretsManagerClientFactory = () => {
  let client: SecretsManagerClient;
  return (): SecretsManagerClient => {
    if (client) return client;
    client = new SecretsManagerClient();
    return client;
  };
};

export const getSecretsManagerClient = createSecretsManagerClientFactory();

export type GetSecretsManagerClientFn = typeof getSecretsManagerClient;

type SecretManagerRequest = {
  secretId: string;
};

export type GetSecretValueFn = (params: SecretManagerRequest) => Promise<string>;

export const getSecretValue: GetSecretValueFn = async ({ secretId }) => {
  const response = await getSecretsManagerClient().send(
    new GetSecretValueCommand({ SecretId: secretId }),
  );
  if (!response.SecretString) throw new Error('No SecretString when calling getSecretValue');
  return response.SecretString;
};

export const fakeGetSecretValue: GetSecretValueFn = async ({ secretId }) => {
  const secret = process.env[secretId];
  if (!secret)
    throw new Error(
      `Secret ${secretId} is not defined in environment variables when calling fakeGetSecretValue`,
    );
  return secret;
};
