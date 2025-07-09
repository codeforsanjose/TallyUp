import { describe, expect, it } from 'bun:test';
import { getSecretValue } from '../../src/lib/secrets';

describe('secrets', () => {
  describe('getSecretValue', () => {
    it('throws if no SecretString is returned', async () => {
      const mockClient = {
        send: async () => ({ SecretString: undefined }),
      };
      const result = getSecretValue(mockClient, 'mockSecretId');
      expect(result).rejects.toThrow();
    });

    it('returns the SecretString if available', async () => {
      const mockClient = {
        send: async () => ({ SecretString: 'mockSecretValue' }),
      };
      const result = await getSecretValue(mockClient, 'mockSecretId');
      expect(result).toBe('mockSecretValue');
    });
  });
});
