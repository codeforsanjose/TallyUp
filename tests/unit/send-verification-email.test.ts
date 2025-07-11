import { afterEach, describe, expect, it, mock } from 'bun:test';
import { sendVerificationEmail } from '../../src/lib/email';

const mockClient = { send: mock() };

afterEach(() => {
  mockClient.send.mockReset();
});

describe('sendVerificationEmail', () => {
  it("doesn't call .send() in development", async () => {
    process.env.NODE_ENV = 'development';
    const result = await sendVerificationEmail({
      destinationEmail: 'test@email.com',
      domainName: 'mockDomain.com',
      stage: 'mockStack',
      token: 'mockToken',
      sesClient: mockClient,
    });

    expect(mockClient.send).not.toHaveBeenCalled();
    expect(result).toBe('mock-message-id-for-development');
  });

  it('calls .send() in production', async () => {
    process.env.NODE_ENV = 'production';
    const mockMessageId = 'mockMessageId123';
    mockClient.send.mockResolvedValue({ MessageId: mockMessageId });

    const result = await sendVerificationEmail({
      destinationEmail: 'test@email.com',
      domainName: 'mockDomain.com',
      stage: 'mockStack',
      token: 'mockToken',
      sesClient: mockClient,
    });

    expect(mockClient.send).toHaveBeenCalled();
    expect(result).toBe(mockMessageId);
  });
});
