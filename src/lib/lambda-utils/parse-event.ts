import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { z } from 'zod';
import type { Result } from '../types';

export type ParseEventFn = typeof parseEvent;

type ParseEventParams<T extends Record<string, unknown>> = {
  requestModel: Pick<z.ZodType<T>, 'safeParse'>;
  pathParameters: APIGatewayProxyEventV2['pathParameters'];
} & (
  | {
      queryStringParameters?: APIGatewayProxyEventV2['queryStringParameters'];
      method: 'GET';
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

  try {
    const dataSource =
      method === 'GET' ? params.queryStringParameters : JSON.parse(params.body || '{}');
    const parseResult = requestModel.safeParse(dataSource);
    if (!parseResult.success)
      return { success: false, error: new Error(parseResult.error.message) };

    return { success: true, data: { ...parseResult.data, ...pathParameters } } as Result<T & V>;
  } catch (error) {
    return { success: false, error: new Error(`Invalid JSON in request body: ${params}`) };
  }
};
