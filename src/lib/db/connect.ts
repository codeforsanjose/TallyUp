import { DsqlSigner, type DsqlSignerConfig } from '@aws-sdk/dsql-signer';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

import * as schema from './schema';
import type { z, ZodType } from 'zod';
import type { BaseResponse } from '../../openapi';
import type { Result } from '../types';

type ConnectionConfig = {
  admin?: boolean;
  clusterEndpoint: string;
  credentials?: DsqlSignerConfig['credentials'];
};

export type Db = Awaited<ReturnType<typeof connect>>;

export const connect = async (params: ConnectionConfig) => {
  const { admin, credentials, clusterEndpoint } = params;

  // Get db credentials https://docs.aws.amazon.com/aurora-dsql/latest/userguide/authentication-authorization.html
  const dbSigner = new DsqlSigner({
    hostname: clusterEndpoint,
    credentials,
    region: 'us-west-2',
  });
  const password = !admin
    ? await dbSigner.getDbConnectAuthToken()
    : await dbSigner.getDbConnectAdminAuthToken();

  const pgClient = new Client({
    host: clusterEndpoint,
    user: admin ? 'admin' : 'tallyup',
    password,
    database: 'postgres',
    ssl: true,
    port: 5432,
  });
  await pgClient.connect();

  return drizzle({ client: pgClient, casing: 'snake_case', schema });
};

export const withDb = async <T extends ZodType, V extends BaseResponse>(
  config: ConnectionConfig,
  action: (
    db: Awaited<ReturnType<typeof connect>>,
    data: z.infer<T>,
  ) => Promise<(data: z.infer<T>) => Promise<Result<V>>>,
) => {
  const db = await connect(config);
  const result = await action(db, config);
  await db.$client.end();
  return result;
};
