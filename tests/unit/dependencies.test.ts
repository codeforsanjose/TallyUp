import { describe, expect, it } from 'bun:test';
import {
  defineGetDependenciesFn,
  mergeDependencies,
} from '../../src/lib/lambda-utils/build-http-handler-v2/dependencies';

describe('dependencies', () => {
  it('defineGetDependenciesFn returns the same function', () => {
    const fn = async () => ({});
    const definedFn = defineGetDependenciesFn(fn);
    expect(definedFn).toBe(fn);
  });
  it('mergeDependencies merge multiple dependencies into one', async () => {
    const dep1 = async () => ({ a: 1 });
    const dep2 = async () => ({ b: 2 });
    const merged = mergeDependencies(dep1, dep2);
    const result = await merged({} as any);
    expect(result).toEqual({ a: 1, b: 2 });
  });
});
