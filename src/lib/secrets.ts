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

export const getSecretValue = async (
  client: SecretsManagerClient,
  secretId: string,
): Promise<string> => {
  if (process.env.NODE_ENV !== 'production') {
    // In development, we can use a local .env file or similar to mock secrets
    const secretValue = process.env[secretId];
    if (!secretValue) {
      throw new Error(`Secret ${secretId} not found in environment variables`);
    }
    return secretValue;
  }

  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) throw new Error('No SecretString when calling getSecretValue');
  return response.SecretString;
};
