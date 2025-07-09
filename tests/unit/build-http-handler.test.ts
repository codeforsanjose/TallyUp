import { describe, expect, it, mock, spyOn, type Mock } from 'bun:test';
import z from 'zod';
import { buildHttpHandlerFactory } from '../../src/lib/lambda-utils';
import { parseEvent, type ParseEventFn } from '../../src/lib/lambda-utils/parse-event';
import { mockApiGatewayEvent } from './mock-api-gateway-event';
const mockParseEvent = mock(parseEvent).mockReturnValue({
  success: true,
  data: { message: 'Hello, World!' },
}) as Mock<ParseEventFn>;
const buildHttpHandler = buildHttpHandlerFactory(mockParseEvent as ParseEventFn);
const mockRequestModel = z.object({
  message: z.string(),
});

const mockAction = mock().mockImplementation(async (data: { message: string }) => ({
  success: true,
  data,
}));

const errorSpy = spyOn(console, 'error').mockImplementation(() => {});
const logSpy = spyOn(console, 'log').mockImplementation(() => {});

describe('buildHttpHandler', () => {
  it('405 if method is not supported', async () => {
    const mockEvent = mockApiGatewayEvent({
      requestContext: {
        http: {
          method: 'WOWZA',
        },
      },
    });
    const result = await buildHttpHandler({
      requestModel: mockRequestModel,
      action: mockAction,
      dependencies: [],
    })(mockEvent);

    expect(result.statusCode).toBe(405);
    expect(mockAction).not.toHaveBeenCalled();
  });

  it('400 if parseEventFn fails', async () => {
    const mockEvent = mockApiGatewayEvent();
    const errorMessage = 'Mocked parse error';
    mockParseEvent.mockReturnValueOnce({
      success: false,
      error: new Error(errorMessage),
    });
    const result = await buildHttpHandler({
      requestModel: mockRequestModel,
      action: mockAction,
      dependencies: [],
    })(mockEvent);

    expect(result.statusCode).toBe(400);
    expect(mockAction).not.toHaveBeenCalled();
    expect(result.body).toContain(errorMessage);
  });

  it('logs to console and throws if action throws', async () => {
    const mockEvent = mockApiGatewayEvent({
      body: JSON.stringify({ message: 'Hello, World!' }),
    });

    mockAction.mockRejectedValueOnce(new Error('Mocked action error'));

    const result = buildHttpHandler({
      requestModel: mockRequestModel,
      action: mockAction,
      dependencies: [],
    })(mockEvent);

    expect(result).rejects.toThrow('Mocked action error');
    expect(errorSpy).toHaveBeenCalled();
    expect(mockAction).toHaveBeenCalled();
  });

  it('400s if action fails', async () => {
    const mockEvent = mockApiGatewayEvent({
      body: JSON.stringify({ message: 'Hello, World!' }),
    });

    mockAction.mockResolvedValueOnce({
      success: false,
      error: new Error('Mocked action failure'),
    });

    const result = await buildHttpHandler({
      requestModel: mockRequestModel,
      action: mockAction,
      dependencies: [],
    })(mockEvent);

    expect(result.statusCode).toBe(400);
    expect(mockAction).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it('200s and returns action result on success', async () => {
    const mockEvent = mockApiGatewayEvent({
      body: JSON.stringify({ message: 'Hello, World!' }),
    });

    const result = await buildHttpHandler({
      requestModel: mockRequestModel,
      action: mockAction,
      dependencies: [],
    })(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(mockAction).toHaveBeenCalled();
    expect(result.body).toBeDefined();
  });
});
