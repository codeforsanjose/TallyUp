import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export const pushSchema = async () => {
  const { DB_URL_SECRET_ARN } = process.env;
  if (!DB_URL_SECRET_ARN) {
    console.error('DB_URL_SECRET_ARN must be defined in process.env');
    process.exit(1);
  }

  const { SecretString } = await new SecretsManagerClient().send(
    new GetSecretValueCommand({
      SecretId: DB_URL_SECRET_ARN,
    }),
  );
  if (!SecretString) {
    console.error('Failed to retrieve database URL from secrets manager');
    process.exit(1);
  }

  const pushSchema = Bun.spawnSync({
    cmd: ['drizzle-kit', 'push'],
    stderr: 'inherit',
    stdout: 'inherit',
    env: {
      ...(process.env as Record<string, string>),
      DATABASE_URL: SecretString,
    },
  });
  if (pushSchema.exitCode !== 0) {
    console.error('Failed to push schema');
    process.exit(pushSchema.exitCode);
  }
};

if (import.meta.main) {
  await pushSchema();
}
