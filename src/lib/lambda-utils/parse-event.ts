import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { z } from 'zod';
import type { Result } from '../types';
import assert from 'assert';

type ParseEventParams<T extends Record<string, unknown>> = {
  requestModel: z.ZodType<T>;
  pathParameters: APIGatewayProxyEventV2['pathParameters'];
} & (
  | {
      queryStringParameters?: APIGatewayProxyEventV2['queryStringParameters'];
      method: 'GET' | 'HEAD';
    }
  | {
      body: APIGatewayProxyEventV2['body'];
      method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    }
);

export const parseEvent = <
  T extends Record<string, unknown> = Record<string, unknown>,
  V extends Record<string, unknown> = Record<string, unknown>,
>(
  params: ParseEventParams<T>,
): Result<T & V> => {
  const { requestModel, pathParameters, method } = params;

  // Validate method
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].includes(method)) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }

  if (method === 'GET' || method === 'HEAD') {
    // For GET and HEAD, query parameters are used
    // return { ...requestModel.parse(event.queryStringParameters || {}), ...pathParameters };
    if (!params.queryStringParameters)
      return { success: false, error: new Error('Query parameters are required') };
    const parseResult = requestModel.safeParse(params.queryStringParameters);
    if (!parseResult.success)
      return { success: false, error: new Error(parseResult.error.message) };
    return { success: true, data: { ...parseResult.data, ...pathParameters } } as Result<T & V>;
  } else {
    assert(
      method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH',
      `Unsupported HTTP method: ${method}`,
    );
    // For other methods, the body is used
    if (!params.body) return { success: false, error: new Error('Request body is required') };
    try {
      const body = JSON.parse(params.body);
      const parseResult = requestModel.safeParse(body);
      if (!parseResult.success)
        return { success: false, error: new Error(parseResult.error.message) };
      return { success: true, data: { ...parseResult.data, ...pathParameters } } as Result<T & V>;
    } catch (error) {
      return { success: false, error: new Error(`Invalid JSON in request body: ${params.body}`) };
    }
  }
};
