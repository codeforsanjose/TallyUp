import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { makeApiRequest } from './make-api-request';
import type { RegisterResponse } from '../../src/lib/openapi';
import { client } from './db-client';
import { count } from 'drizzle-orm';

const makeRegisterRequest = (data: Record<string, any>) => {
  return makeApiRequest<RegisterResponse>({
    path: '/api/register',
    options: {
      body: data,
      method: 'POST',
    },
  });
};

beforeAll(async () => {
  // Clear the users table before tests
  await client.delete(client._.fullSchema.users);
});

afterAll(async () => {
  // Clean up the users table after tests
  await client.delete(client._.fullSchema.users);
});

describe('Register Flow', () => {
  it("doesn't store invalid credentials", async () => {
    const result = await makeRegisterRequest({ email: 'not-an-email', password: 'badpassword' });
    expect(result.status).toBe(400);
    const countResult = await client.select({ count: count() }).from(client._.fullSchema.users);
    expect(countResult[0]!.count).toBe(0);
  });

  it('stores valid credentials', async () => {
    const result = await makeRegisterRequest({
      email: 'email@email.com',
      password: 'ValidPassword1!',
    });
    expect(result.status).toBe(200);
    expect(result.body.userId).toBeDefined();
    const countResult = await client.select({ count: count() }).from(client._.fullSchema.users);
    expect(countResult[0]!.count).toBe(1);
  });
});
