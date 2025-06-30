import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { z } from 'zod';
import { buildResponse } from './build-response';
import type { BaseResponse } from './openapi';
import { safeParseEventBody } from './safe-parse';
import type { Result } from './types';

type ApiEventHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export type Action<
  T extends Record<string, unknown>,
  V extends BaseResponse,
  Deps extends Record<string, unknown>,
> = (data: T, deps: Deps, rawEvent: APIGatewayProxyEvent) => Promise<Result<V>>;

export type DepStrategy<T> = () => Promise<T>;

type DependencyStrategies<Deps extends Record<string, unknown>> = DepStrategy<{
  [K in keyof Deps]?: Deps[K];
}>[];

type BuiltAction<T extends Record<string, unknown>, V extends BaseResponse> = Promise<
  (data: T, event: APIGatewayProxyEvent) => Promise<Result<V>>
>;

const buildAction = async <
  T extends Record<string, unknown>,
  V extends BaseResponse,
  Deps extends Record<string, unknown>,
>(
  action: Action<T, V, Deps>,
  depStrategies: DependencyStrategies<Deps>,
): BuiltAction<T, V> => {
  // Arrayify
  const finalStrategies = Array.isArray(depStrategies) ? depStrategies : [depStrategies];
  const deps = (await Promise.all(finalStrategies.map((strategy) => strategy()))).reduce(
    (acc, dep) => ({ ...acc, ...dep }),
    {} as Deps,
  );

  // Build action with dependencies
  return async (data, event) => {
    try {
      const result = await action(data, deps, event);
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };
};

export const buildHttpHandler = <
  T extends Record<string, unknown>,
  V extends BaseResponse,
  Deps extends Record<string, unknown>,
>(
  requestModel: z.ZodType<T>,
  action: Action<T, V, Deps>,
  depStrategies: DependencyStrategies<Deps>,
): ApiEventHandler => {
  return async (event) => {
    // Parse
    if (!event.body) return buildResponse(400, { message: 'Request body is required' });
    const parseResult =
      event.requestContext.httpMethod === 'GET' || event.requestContext.httpMethod === 'HEAD'
        ? requestModel.safeParse(event.queryStringParameters)
        : safeParseEventBody(requestModel, event.body);
    if (!parseResult.success)
      return buildResponse(400, { message: `Invalid request body: ${parseResult.error}` });

    // Execute action
    const actionWithDeps = await buildAction(action, depStrategies);
    const actionResult = await actionWithDeps(parseResult.data, event);
    if (!actionResult.success) return buildResponse(400, { message: actionResult.error.message });

    // Build response
    return buildResponse(200, actionResult.data);
  };
};
