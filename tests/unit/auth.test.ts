import { jwtKeyDependency, signJwtToken, verifyJwtToken } from '../../src/lib/auth';
import { describe, it, expect, mock } from 'bun:test';
import jwt from 'jsonwebtoken';
import { expectAssert } from '../expect-assert';

describe('auth', () => {
  it('signJwtToken signs a JWT token with the required properties', () => {
    const userId = 'testUserId';
    const jwtKey = 'mockKey';
    const token = signJwtToken({ userId, jwtKey });

    // Expect app-specific properties to be present in the token
    const decoded = jwt.verify(token, jwtKey);
    expect(decoded).toBeDefined();
    expect(decoded).toHaveProperty('userId', userId);
  });

  it('verifyJwtToken verifies a JWT token and returns the userId', async () => {
    const userId = 'testUserId';
    const token = jwt.sign({ userId }, 'mockKey', { algorithm: 'HS256' });

    const result = await verifyJwtToken(token, 'mockKey');
    expectAssert(result.success);
    expect(result.data).toEqual({ userId });
  });

  describe('jwtKeyDependency', () => {
    const mockSecretsManagerClient = {
      send: mock(),
    };

    it('returns a mock JWT key in development', async () => {
      process.env.NODE_ENV = 'development';
      const { jwtKey } = await jwtKeyDependency(mockSecretsManagerClient).strategy({
        JWT_SECRET_ARN: 'mockArn',
      });
      expect(jwtKey).toBeDefined();
    });

    it('returns the value from getSecretValue in production', async () => {
      process.env.NODE_ENV = 'production';
      const mockSecretValue = 'mockSecretValue';
      mockSecretsManagerClient.send.mockResolvedValue({ SecretString: mockSecretValue });

      const { jwtKey } = await jwtKeyDependency(mockSecretsManagerClient).strategy({
        JWT_SECRET_ARN: 'mockArn',
      });
      expect(jwtKey).toBe(mockSecretValue);
    });
  });
});
