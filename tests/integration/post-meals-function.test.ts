import { eq } from 'drizzle-orm';
import type { PostMealsRequestModel, PostMealsResponseModel } from '../../src/gen/zod/schemas.ts';
import { signAccessToken } from '../../src/lib/auth/tokens.ts';
import { client } from './db-client.ts';
import { makeApiRequest } from './make-api-request';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

const mockUserUuid = '1cff8c68-1fe6-40b2-a382-b1cf46109786';
const fakeAccessToken = await signAccessToken(
  {
    userId: mockUserUuid,
    role: 'admin',
    status: 'active',
  },
  'supersecret',
);

const mockPostMealsRequest = (data: PostMealsRequestModel) => {
  return makeApiRequest<PostMealsResponseModel>({
    path: '/api/meals',
    options: {
      body: data,
      method: 'POST',
      headers: {
        authorization: `Bearer ${fakeAccessToken}`,
      },
    },
  });
};

beforeAll(async () => {
  // Add the mock user to the database
  const { users: usersTable } = client._.fullSchema;
  await client.insert(usersTable).values({
    id: mockUserUuid,
    email: 'test@email.com',
    role: 'admin',
    status: 'active',
    passwordHash: 'hashedpassword',
  });
});

afterAll(async () => {
  // Clean up the meals table after tests
  const { meals: mealsTable } = client._.fullSchema;
  await client.delete(mealsTable);

  // Clean up the users table
  const { users: usersTable } = client._.fullSchema;
  await client.delete(usersTable);
});

describe('Post Meals Function', () => {
  it('401s if request has no auth header', async () => {
    const response = await makeApiRequest<PostMealsResponseModel>({
      path: '/api/meals',
      options: {
        method: 'POST',
        body: {
          adult: 0,
          youth: 0,
          inventory: 100,
        } as PostMealsRequestModel,
      },
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authorization header is missing');
  });

  it('400s if request body is invalid', async () => {
    const response = await mockPostMealsRequest({
      adult: -2,
      youth: 0,
      inventory: 100,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('parse request');
  });

  it('successfully posts a meal', async () => {
    const response = await mockPostMealsRequest({
      adult: 10,
      youth: 10,
      inventory: 100,
    });

    const { meals: mealsTable } = client._.fullSchema;
    const meals = await client
      .select()
      .from(mealsTable)
      .where(eq(mealsTable.staffCreatorId, mockUserUuid));
    const meal = meals[0];

    expect(response.status).toBe(201);
    expect(meal).toBeDefined();
    expect(meal!.adult).toBe(10);
    expect(meal!.youth).toBe(10);
    expect(meal!.inventory).toBe(100);
    expect(meal!.quantity).toBe(100);
  });
});
