import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { buildHttpHandlerV2 } from '../../src/lib/lambda-utils/build-http-handler-v2';
import { mockApiGatewayEvent } from './mock-api-gateway-event';

const getDependencies = mock();
const action = mock();
const handler = buildHttpHandlerV2({
  getDependencies,
  action,
});
const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  getDependencies.mockReset();
  action.mockReset();
  errorSpy.mockReset();
});

describe('buildHttpHandlerV2', () => {
  it('returns early if getDependencies returns an ActionResult', async () => {
    const event = mockApiGatewayEvent();
    getDependencies.mockResolvedValueOnce({
      statusCode: 200,
      body: { message: 'Whoa' },
    });
    const result = await handler(event);
    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 200,
        body: JSON.stringify({ message: 'Whoa' }),
      }),
    );
    expect(action).not.toHaveBeenCalled();
  });

  it('returns the result of the action', async () => {
    const event = mockApiGatewayEvent();
    getDependencies.mockResolvedValueOnce({ someDependency: 'value' });
    action.mockResolvedValueOnce({
      statusCode: 200,
      body: { message: 'Cool beans' },
    });

    const result = await handler(event);
    expect(result).toEqual(
      expect.objectContaining({
        statusCode: 200,
        body: JSON.stringify({ message: 'Cool beans' }),
      }),
    );
    expect(action).toHaveBeenCalledWith({ someDependency: 'value' });
  });

  describe('if anything throws, it logs the error and rethrows', async () => {
    it('getDependencies throws', async () => {
      const event = mockApiGatewayEvent();
      getDependencies.mockRejectedValueOnce(new Error('Failed to get dependencies'));

      expect(handler(event)).rejects.toThrow('Failed to get dependencies');
      expect(errorSpy).toHaveBeenCalled();
      expect(action).not.toHaveBeenCalled();
    });

    it('action throws', async () => {
      const event = mockApiGatewayEvent();
      getDependencies.mockResolvedValueOnce({ someDependency: 'value' });
      action.mockRejectedValueOnce(new Error('Something went wrong'));

      expect(handler(event)).rejects.toThrow('Something went wrong');
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
