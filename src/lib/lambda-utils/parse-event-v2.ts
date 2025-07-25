import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import z from 'zod';
import type { Result } from '../types';

export type EventDataParsers = {
  body?: z.ZodType<Record<string, unknown>>;
  headers?: z.ZodType<Record<string, unknown>>;
  path?: z.ZodType<Record<string, unknown>>;
  query?: z.ZodType<Record<string, unknown>>;
};

export type ExecuteParsersResult<T extends EventDataParsers> = {
  [K in keyof T]: T[K] extends z.ZodType<infer U> ? U : never;
};

export type ParseEventResultV2<T extends EventDataParsers> = Result<ExecuteParsersResult<T>>;

const executeParser = <T>(parser: z.ZodType<T> | undefined, data: unknown): T | undefined => {
  return parser?.parse(data);
};

const executeParsers = <T extends EventDataParsers>(
  parsers: T,
  event: APIGatewayProxyEventV2,
): ExecuteParsersResult<T> => {
  return {
    ...(parsers.body && { body: executeParser(parsers.body, event.body) }),
    ...(parsers.headers && { headers: executeParser(parsers.headers, event.headers) }),
    ...(parsers.path && { path: executeParser(parsers.path, event.pathParameters) }),
    ...(parsers.query && { query: executeParser(parsers.query, event.queryStringParameters) }),
  } as unknown as ExecuteParsersResult<T>; // TODO: Do you know how to fix this type assertion?
};

export const parseEventV2 = <T extends EventDataParsers>(
  event: APIGatewayProxyEventV2,
  parsers: T,
): ParseEventResultV2<T> => {
  try {
    const data = executeParsers(parsers, event);
    const result = {
      success: true,
      data,
    };
    return result as Result<ExecuteParsersResult<T>>;
  } catch (error) {
    console.error('Error parsing event:', error);
    return {
      success: false,
      error: new Error('Failed to parse event data'),
    } as Result<ExecuteParsersResult<T>>;
  }
};

export type ParseEventFn = typeof parseEventV2;
