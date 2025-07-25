import type { Result } from '../../src/lib/types';
import { resolve } from 'node:path';

type BuildPathsConfig = {
  entrypoints: string[];
  buildDir: string;
};

export const bunBuild = async ({
  entrypoints,
  buildDir,
}: BuildPathsConfig): Promise<Result<Bun.BuildOutput[]>> => {
  const results = await Promise.allSettled(
    entrypoints.map((entry) => {
      const fileNameWithoutExt = entry
        .split('/')
        .pop()
        ?.replace(/\.[^/.]+$/, '');
      if (!fileNameWithoutExt) {
        throw new Error(`Invalid entry point: ${entry}`);
      }
      const outdir = resolve(buildDir, fileNameWithoutExt);

      return Bun.build({
        entrypoints: [entry],
        format: 'esm',
        minify: {
          syntax: true,
          whitespace: true,
        },
        naming: '[dir]/index.mjs', // [dir=buildDir]/[name=functionName]/index.mjs
        outdir,
        sourcemap: 'linked',
        target: 'node',
        external: ['@node-rs/argon2'],
        define: {
          'process.env.NODE_ENV': '"production"',
        },
      });
    }),
  );

  const failed = results
    .filter((result) => result.status === 'rejected')
    .map((result, i) => {
      console.error(`Build failed for entry: ${entrypoints[i]}`);
      console.error(result.reason);
      return [entrypoints[i], result.reason];
    });
  if (failed.length > 0) {
    console.error('Build failed for the following entries:');

    return {
      success: false,
      error: new Error(
        `Build failed for entries:\n ${failed.map(([entry, error]) => `${entry}: ${error}`).join('\n')}`,
      ),
    };
  }

  return {
    success: true,
    data: results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<Bun.BuildOutput>).value),
  };
};
