import {
  SecretsManagerClient,
  type SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import { Pool } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { createDependency } from '../lambda-utils/create-dependency';
import { getSecretValue } from '../secrets';
import * as schema from './schema';

export type RawDrizzleDependency = Awaited<
  ReturnType<ReturnType<typeof drizzleDependency>['strategy']>
>;

export const drizzleDependency = (secrets?: SecretsManagerClient | SecretsManagerClientConfig) =>
  createDependency(
    async (env) => {
      const secretName = env['DB_URL_SECRET_ARN'];
      if (!secretName)
        throw new Error(
          "DB_URL_SECRET_ARN is not defined in environment variables, but this should've been caught by cleanEnv",
        );

      const client =
        secrets instanceof SecretsManagerClient ? secrets : new SecretsManagerClient(secrets || {});
      const response = await getSecretValue(client, secretName);

      const drizzleClient =
        process.env.NODE_ENV === 'development'
          ? pgDrizzle(new PgPool({ connectionString: response }), { casing: 'snake_case', schema })
          : drizzle(new Pool({ connectionString: response }), { casing: 'snake_case', schema });

      return { drizzle: drizzleClient };
    },
    ['DB_URL_SECRET_ARN'] as const,
  );
