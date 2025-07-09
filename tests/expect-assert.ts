import { expect } from 'bun:test';

export const expectAssert: (condition: boolean) => asserts condition is true = (condition) => {
  expect(condition).toBe(true);
  if (!condition) throw new Error('Assertion failed');
};
