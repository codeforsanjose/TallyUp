import { describe, expect, it } from 'bun:test';
import { getEnv } from '../../src/lib/env';

describe('env', () => {
  describe('getEnv', () => {
    it('returns the name of the environment variable if it is not set in development', () => {
      process.env.NODE_ENV = 'development';
      const result = getEnv('TEST_VAR');
      expect(result).toBe('TEST_VAR');
    });

    it('throws an error if the environment variable is not set in production', () => {
      process.env.NODE_ENV = 'production';
      expect(() => getEnv('TEST_VAR')).toThrow();
    });

    it('returns the value of the environment variable if it is set', () => {
      process.env['TEST_VAR'] = 'testValue';
      const result = getEnv('TEST_VAR');
      expect(result).toBe('testValue');
    });
  });
});
