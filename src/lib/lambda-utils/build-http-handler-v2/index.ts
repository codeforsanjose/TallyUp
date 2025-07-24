import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { buildResponse } from '../build-response';
import type { GetDependenciesFn } from './dependencies';

export type ActionResult<R> = Omit<APIGatewayProxyStructuredResultV2, 'body'> & {
  statusCode: number;
  body: R;
};

export type Action<D, R> = (deps: D) => Promise<ActionResult<R>>;

type BuildHttpHandlerV2Params<D extends NonNullable<unknown>, R extends object> = {
  getDependencies: GetDependenciesFn<D>;
  action: Action<D, R>;
};

type BuildHttpHandlerV2Function = <D extends NonNullable<unknown>, R extends object>(
  params: BuildHttpHandlerV2Params<D, R>,
) => (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;

export const buildHttpHandlerV2: BuildHttpHandlerV2Function = ({ getDependencies, action }) => {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
      const dependencies = await getDependencies(event);
      if ('statusCode' in dependencies && 'body' in dependencies) {
        // If dependencies return an ActionResult, return it directly
        return buildResponse(dependencies.statusCode, dependencies.body);
      }
      const result = await action(dependencies);

      return buildResponse(result.statusCode, result.body);
    } catch (error) {
      console.error('Error in handler:', error);
      throw error;
    }
  };
};
