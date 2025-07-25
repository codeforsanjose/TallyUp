import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { ActionResult } from '.';

export type DependencyOf<G extends GetDependenciesFn<unknown>> =
  G extends GetDependenciesFn<infer D> ? D : never;

export type GetDependenciesFn<D> = (
  event: APIGatewayProxyEventV2,
) => Promise<D | ActionResult<{ message: string }>>;

export type MergedDependencies<Gs extends readonly GetDependenciesFn<Record<string, unknown>>[]> =
  Gs extends [GetDependenciesFn<infer D>, ...infer Rest]
    ? Rest extends readonly GetDependenciesFn<Record<string, unknown>>[]
      ? D & MergedDependencies<Rest>
      : D
    : {};

/** Type caster for GetDependenciesFn */
export const defineGetDependenciesFn = <D extends Record<string, unknown>>(
  getDependencies: GetDependenciesFn<D>,
): GetDependenciesFn<D> => getDependencies;

export const mergeDependencies = <Gs extends GetDependenciesFn<Record<string, unknown>>[]>(
  ...getDependenciesFns: Gs
): GetDependenciesFn<MergedDependencies<Gs>> => {
  return async (event: APIGatewayProxyEventV2) => {
    const dependencies = await Promise.all(getDependenciesFns.map((getDeps) => getDeps(event)));
    const result = Object.assign({}, ...dependencies);
    return result;
  };
};
