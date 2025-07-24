import z from 'zod';
import { defineGetDependenciesFn } from './dependencies';
import type { Result } from '../../types';

export type EventParsers = {
  body?: z.ZodType<unknown>;
  query?: z.ZodType<unknown>;
  path?: z.ZodType<unknown>;
  headers?: z.ZodType<unknown>;
  cookies?: z.ZodType<unknown>;
} & Record<string, z.ZodType<unknown>>;

export type ParsedEvent<T extends EventParsers> = {
  [K in keyof T]: z.infer<T[K]>;
};

export const parseEventDependency = <T extends EventParsers>(parsers: T) =>
  defineGetDependenciesFn(async (event): Promise<{ parsedEvent: Result<ParsedEvent<T>> }> => {
    try {
      return {
        parsedEvent: {
          success: true,
          data: {
            body: parsers.body?.parse(JSON.parse(event.body!)),
            cookies: parsers.cookies?.parse(event.cookies),
            headers: parsers.headers?.parse(event.headers),
            path: parsers.path?.parse(event.pathParameters),
            query: parsers.query?.parse(event.queryStringParameters),
          },
        } as Result<ParsedEvent<T>>,
      };
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) {
        console.error('Event parsing error:', error);
        return {
          parsedEvent: {
            success: false,
            error: new Error(
              'Failed to parse request. Please check the request format and try again.',
            ),
          },
        };
      }

      throw error; // Re-throw unexpected errors
    }
  });
