// import { describe, expect, it, mock } from 'bun:test';
// import assert from 'node:assert';
// import type { GetDbClientFn } from '../../src/lib/db';
// import { getPostMealAction } from '../../src/post-meals-function';
// import { afterEach } from 'node:test';

// const env = { DB_URL_SECRET_ARN: 'mock-arn' };
// const mockMealId = 'mock-meal-id';
// const mockReturning = mock(() => [{ mealId: mockMealId }]);
// const mockValues = mock(() => ({ returning: mockReturning }));
// const mockInsert = mock(() => ({ values: mockValues }));

// const getDbClient: GetDbClientFn = mock(async () => {
//   return { insert: mockInsert, _: { fullSchema: { meals: {} } } } as any;
// });

// afterEach(() => {
//   mockInsert.mockClear();
//   mockValues.mockClear();
//   mockReturning.mockClear();
// });

// describe('post-meals', () => {
//   describe('postMealsDependency', () => {
//     it('throws if DB_URL_SECRET_ARN is not set', async () => {
//       expect(() => postMealsDependency({}, getDbClient)({} as any)).toThrow();
//     });

//     describe('insertMeal', async () => {
//       it('throws if no meal is created', async () => {
//         const deps = await postMealsDependency(env, getDbClient)({} as any);
//         assert(!('statusCode' in deps), 'Expected dependencies to not have statusCode');
//         const { insertMeal } = deps;
//         mockReturning.mockReturnValueOnce([]);
//         expect(
//           insertMeal({ userId: 'user123', adult: 2, inventory: 100, youth: 1 }),
//         ).rejects.toThrow();
//       });

//       it('makes a db call and returns mealId', async () => {
//         const deps = await postMealsDependency(env, getDbClient)({} as any);
//         assert(!('statusCode' in deps), 'Expected dependencies to not have statusCode');
//         const { insertMeal } = deps;
//         const result = await insertMeal({ userId: 'user123', adult: 2, inventory: 100, youth: 1 });
//         expect(mockInsert).toHaveBeenCalled();
//         expect(result).toEqual({ mealId: mockMealId });
//       });
//     });
//   });

//   describe('postMealAction', () => {
//     it('returns error if user is not authenticated', async () => {
//       const result = await getPostMealAction({
//         body: { adult: 2, inventory: 100, youth: 1 },
//         user: { success: false, error: new Error('Not authenticated') },
//         insertMeal: mock(() => Promise.resolve({ mealId: mockMealId })),
//       });
//       expect(result.statusCode).toBe(403);
//       expect(result.body).toEqual({ message: 'Not authenticated' });
//     });

//     it('returns created meal on success', async () => {
//       const result = await getPostMealAction({
//         body: { adult: 2, inventory: 100, youth: 1 },
//         user: { success: true, data: { userId: 'user123', role: 'admin', status: 'active' } },
//         insertMeal: mock(() => Promise.resolve({ mealId: mockMealId })),
//       });
//       expect(result.statusCode).toBe(201);
//       expect(result.body).toEqual(expect.objectContaining({ mealId: mockMealId }));
//     });
//   });
// });
