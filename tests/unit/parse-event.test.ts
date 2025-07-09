import { describe, expect, it, mock } from 'bun:test';
import { parseEvent } from '../../src/lib/lambda-utils/parse-event';
import { mockApiGatewayEvent } from './mock-api-gateway-event';
import { expectAssert } from '../expect-assert';

const requestModel = {
  safeParse: mock().mockImplementation(
    (data: Record<string, any>) =>
      ({
        success: true,
        data,
      }) as const,
  ),
};

describe('parseEvent', () => {
  it('should parse GET requests with query parameters', () => {
    const event = mockApiGatewayEvent({
      requestContext: {
        http: { method: 'GET', path: '/test' },
      },
      queryStringParameters: { param1: 'value1', param2: 'value2' },
      pathParameters: { id: '123' },
    });

    const result = parseEvent({
      requestModel,
      pathParameters: event.pathParameters,
      queryStringParameters: event.queryStringParameters,
      method: 'GET',
    });

    expectAssert(result.success);
    expect(result.data).toEqual({
      param1: 'value1',
      param2: 'value2',
      id: '123',
    });
  });

  it('should parse POST/PUT/DELETE requests with body', () => {
    ['POST', 'PUT', 'DELETE'].forEach((method) => {
      const event = mockApiGatewayEvent({
        requestContext: {
          http: { method, path: '/test' },
        },
        body: JSON.stringify({ key1: 'value1', key2: 'value2' }),
        pathParameters: { id: '123' },
      });

      const result = parseEvent({
        requestModel,
        pathParameters: event.pathParameters,
        body: event.body,
        method: 'POST',
      });

      expectAssert(result.success);
      expect(result.data).toEqual({
        key1: 'value1',
        key2: 'value2',
        id: '123',
      });
    });
  });

  it('should handle invalid JSON in body', () => {
    const event = mockApiGatewayEvent({
      requestContext: {
        http: { method: 'POST', path: '/test' },
      },
      body: '{invalidJson}',
      pathParameters: { id: '123' },
    });

    const result = parseEvent({
      requestModel,
      pathParameters: event.pathParameters,
      body: event.body,
      method: 'POST',
    });

    if (!result.success) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toContain('Invalid JSON');
    } else {
      throw new Error('Expected parseEvent to fail with invalid JSON');
    }
  });
});
