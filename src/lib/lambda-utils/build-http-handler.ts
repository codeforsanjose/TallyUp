import assert from 'assert';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { z } from 'zod';
import type { BaseResponse } from '../openapi';
import type { Result } from '../types';
import { buildResponse } from './build-response';
import { parseEvent, type ParseEventFn } from './parse-event';
import { cleanEnv } from './clean-env';
import type { Dependency } from './types';

type ApiEventHandler = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyStructuredResultV2>;

export type Action<
  T extends Record<string, unknown>,
  V extends BaseResponse,
  RawDeps extends Record<string, unknown>,
  CleanedEnv extends Record<string, string> = Record<string, string>,
> = (
  data: T,
  deps: RawDeps,
  rawEvent: APIGatewayProxyEventV2,
  env: CleanedEnv,
) => Promise<Result<V>>;

type BuiltAction<T extends Record<string, unknown>, V extends BaseResponse> = Promise<
  (data: T, event: APIGatewayProxyEventV2) => Promise<Result<V>>
>;

const buildAction = async <
  T extends Record<string, unknown>,
  V extends BaseResponse,
  Deps extends Record<string, unknown>,
  RequiredEnv extends readonly string[] = readonly string[],
>(
  action: Action<T, V, Deps>,
  depStrategies: Dependency<Partial<Deps>, RequiredEnv>[],
  envParseResult: { [K in RequiredEnv[number]]: string },
): BuiltAction<T, V> => {
  // Arrayify
  const finalStrategies = Array.isArray(depStrategies) ? depStrategies : [depStrategies];
  const deps = (
    await Promise.all(finalStrategies.map(({ strategy }) => strategy(envParseResult)))
  ).reduce((acc, dep) => ({ ...acc, ...dep }), {} as Deps);

  // Build action with dependencies
  return async (data, event) => action(data, deps, event, envParseResult);
};

type BuildHttpHandlerParams<
  T extends Record<string, unknown>,
  V extends BaseResponse,
  RawDeps extends Record<string, unknown>,
  RequiredEnv extends readonly string[] = readonly string[],
> = {
  requestModel: z.ZodType<T>;
  action: Action<T, V, RawDeps>;
  dependencies: Dependency<Partial<RawDeps>, readonly RequiredEnv[number][]>[];
};

export const buildHttpHandlerFactory = (parseEventFn: ParseEventFn) => {
  return <
    T extends Record<string, unknown>,
    V extends BaseResponse,
    Deps extends Record<string, unknown>,
    RequiredEnv extends readonly string[] = readonly string[],
  >(
    params: BuildHttpHandlerParams<T, V, Deps, RequiredEnv>,
  ): ApiEventHandler => {
    const { requestModel, action, dependencies } = params;
    const env = cleanEnv(dependencies);

    return async (event) => {
      try {
        const {
          pathParameters,
          queryStringParameters,
          requestContext: {
            http: { method },
          },
          body,
        } = event;
        if (
          !(
            method === 'GET' ||
            method === 'POST' ||
            method === 'PUT' ||
            method === 'DELETE' ||
            method === 'PATCH'
          )
        ) {
          return buildResponse(405, {
            message: `Method ${method} not allowed. Supported methods are GET, POST, PUT, DELETE, PATCH.`,
          });
        }

        const result = parseEventFn({
          requestModel,
          pathParameters,
          queryStringParameters,
          body,
          method,
        });
        if (!result.success) {
          console.error(`Event parsing failed: ${result.error.message}`);
          return buildResponse(400, { message: result.error.message });
        }

        // Execute action
        const actionWithDeps = await buildAction(action, dependencies, env);
        const actionResult = await actionWithDeps(result.data as T, event);
        if (!actionResult.success) {
          console.log(
            `Action failed: ${actionResult.error.message}\n\n\nCause:\n${actionResult.error.cause}\n\n\nStack:\n${actionResult.error.stack}`,
          );
          return buildResponse(400, { message: actionResult.error.message });
        }

        // Build response
        return buildResponse(200, actionResult.data);
      } catch (error) {
        assert(error instanceof Error, 'How was error not an instance of Error?');
        console.error(`Cause:\n ${error.cause}\n---------\nStack:\n ${error.stack}`);
        throw error; // Re-throw to be handled by AWS Lambda
      }
    };
  };
};

export const buildHttpHandler = buildHttpHandlerFactory(parseEvent);
