import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { AuthRequest, LoginResponse } from '../../src/lib/openapi';
import { makeApiRequest } from './make-api-request';
import { client } from './db-client';
import { hash } from '@node-rs/argon2';
import { notActiveMsg, invalidEmailMsg, loginSuccessMsg } from '../../src/login-function';
import { count } from 'drizzle-orm';

const makeLoginRequest = async (data: AuthRequest) => {
  return makeApiRequest<LoginResponse>({
    path: '/api/login',
    options: {
      method: 'POST',
      body: data,
    },
  });
};

beforeAll(async () => {
  await client.insert(client._.fullSchema.users).values([
    {
      email: 'email@email.com',
      passwordHash: await hash('P@ssword123!', {
        algorithm: 2,
        memoryCost: 65536, // 64 MB
        timeCost: 4, // 4 iterations
        parallelism: 1, // 1 thread
      }),
      status: 'active',
    },
    {
      email: 'inactive@email.com',
      passwordHash: await hash('P@ssword123!', {
        algorithm: 2,
        memoryCost: 65536, // 64 MB
        timeCost: 4, // 4 iterations
        parallelism: 1, // 1 thread
      }),
      status: 'pending',
    },
  ]);
});

afterAll(async () => {
  await client.delete(client._.fullSchema.users);
});

describe('Verify Email Flow', () => {
  test('If I make a request with an unregistered email, I get an error', async () => {
    const response = await makeLoginRequest({
      email: 'unregistered@email.com',
      password: 'P@ssword123!',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(invalidEmailMsg);

    const countResult = await client.select({ count: count() }).from(client._.fullSchema.sessions);
    expect(countResult[0]!.count).toBe(0);
  });

  test('If I make a request with an inactive user, I get an error', async () => {
    const response = await makeLoginRequest({
      email: 'inactive@email.com',
      password: 'P@ssword123!',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(notActiveMsg);

    const countResult = await client.select({ count: count() }).from(client._.fullSchema.sessions);
    expect(countResult[0]!.count).toBe(0);
  });

  test('If I make a request with the wrong password, I get an error', async () => {
    const response = await makeLoginRequest({
      email: 'email@email.com',
      password: 'WrongPassword!',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual(invalidEmailMsg);

    const countResult = await client.select({ count: count() }).from(client._.fullSchema.sessions);
    expect(countResult[0]!.count).toBe(0);
  });

  test('If I make a request with the correct credentials, I get a session ID and refresh token', async () => {
    const response = await makeLoginRequest({
      email: 'email@email.com',
      password: 'P@ssword123!',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toEqual(loginSuccessMsg);
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.sessionId).toBeDefined();

    const countResult = await client.select({ count: count() }).from(client._.fullSchema.sessions);
    expect(countResult[0]!.count).toBe(1);
  });
});
