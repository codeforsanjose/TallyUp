import {
  SecretsManagerClient,
  type SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { createDependency } from '../lambda-utils/create-dependency';
import { getSecretValue } from '../secrets';
import * as schema from './schema';
// @ts-ignore -- used once in the whole project
import ws from 'ws';

export type RawDrizzleDependency = Awaited<
  ReturnType<ReturnType<typeof drizzleDependency>['strategy']>
>;

export const drizzleDependency = (secrets?: SecretsManagerClient | SecretsManagerClientConfig) =>
  createDependency(
    async (env) => {
      if (process.env.NODE_ENV === 'development') {
        neonConfig.useSecureWebSocket = false;
        neonConfig.wsProxy = (host) => `${host}:4444/v1`;
        neonConfig.webSocketConstructor = ws;

        const connectionString = 'postgres://postgres:postgres@db.localtest.me:5432/postgres';
        const client = drizzle(new Pool({ connectionString }), { casing: 'snake_case', schema });
        client;
        return {
          drizzle: client,
        };
      }

      const secretName = env['DB_URL_SECRET_ARN'];
      if (!secretName)
        throw new Error(
          "DB_URL_SECRET_ARN is not defined in environment variables, but this should've been caught by cleanEnv",
        );

      const client =
        secrets instanceof SecretsManagerClient ? secrets : new SecretsManagerClient(secrets || {});
      const response = await getSecretValue(client, secretName);

      const drizzleClient = drizzle(new Pool({ connectionString: response }), {
        casing: 'snake_case',
        schema,
      });

      return { drizzle: drizzleClient };
    },
    ['DB_URL_SECRET_ARN'] as const,
  );
