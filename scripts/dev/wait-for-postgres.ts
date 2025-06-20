import { Client } from 'pg';

export const waitForPostgres = async (url: string, retries = 10, delay = 1000) => {
  const client = new Client({ connectionString: url });

  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      await client.end();
      console.log('PostgreSQL is ready.');
      return;
    } catch (err) {
      console.log(`Waiting for PostgreSQL... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  throw new Error('PostgreSQL did not become ready in time.');
};
