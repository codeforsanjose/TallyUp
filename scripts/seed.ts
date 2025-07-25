import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../src/lib/db/schema';
import { hash } from '@node-rs/argon2';
import { pushSchema } from './push-schema';

export const seed = async ({ dbConnectionUrl }: { dbConnectionUrl: string }) => {
  neonConfig.useSecureWebSocket = !dbConnectionUrl.includes('localtest');
  neonConfig.wsProxy = dbConnectionUrl.includes('localtest')
    ? (host) => `${host}:4444/v1`
    : (host) => `${host}/v2`;
  const db = drizzle({
    client: new Pool({
      connectionString: dbConnectionUrl,
    }),
    schema,
    casing: 'snake_case',
  });

  pushSchema({ verbose: false });

  await db
    .insert(schema.users)
    .values([
      {
        email: 'test@email.com',
        passwordHash: await hash('Password123!'),
        role: 'admin',
        status: 'active',
      },
      {
        email: 'test1@email.com',
        passwordHash: await hash('Password123!'),
        role: 'staff',
        status: 'active',
      },
      { email: 'test2@email.com', passwordHash: await hash('Password123!'), role: 'staff' },
      { email: 'test3@email.com', passwordHash: await hash('Password123!'), role: 'volunteer' },
      {
        email: 'test4@email.com',
        passwordHash: await hash('Password123!'),
        role: 'volunteer',
        status: 'active',
      },
    ])
    .onConflictDoNothing();
};

if (import.meta.main) {
  const dbConnectionUrl = process.env['DB_URL'];
  if (!dbConnectionUrl) {
    console.error('DATABASE_URL must be defined in process.env');
    process.exit(1);
  }
  await seed({ dbConnectionUrl });
}
