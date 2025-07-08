import { build as frontendBuild } from '../frontend/scripts/build';
import { existsSync, globSync, mkdirSync, rmdirSync } from 'fs';
import { resolve } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { Result } from '../src/lib/types';

const outDir = resolve('dist');
const buildDir = resolve(outDir, 'build');

// const cacheDir = resolve(outDir, 'cache');
// TODO: Use dependency tree to calculate a hash for each function

export type BuildConfig = {
  frontend?: boolean;
  globPatterns?: string[];
  verbose?: boolean;
};

const DEFAULTS: Required<BuildConfig> = {
  frontend: true,
  globPatterns: ['./src/*Function.ts'],
  verbose: false,
};

const bunBuild = async (entrypoints: string[]): Promise<Result<Bun.BuildOutput[]>> => {
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

export const build = async (cfg: BuildConfig) => {
  const config = { ...DEFAULTS, ...cfg };
  const { frontend, globPatterns, verbose } = config;

  const buildCandidates = globPatterns.flatMap((pattern) => globSync(pattern, {}));

  if (existsSync(buildDir)) {
    if (verbose) console.log(`Removing existing build directory: ${buildDir}`);
    rmdirSync(buildDir, { recursive: true });
  }

  mkdirSync(buildDir, { recursive: true });

  // WARNING: The below code causes argon2 to be built one level above the function directory,
  // which is not what we want. It should be built in the same directory as the function.
  // This is a known issue with Bun's build system and needs to be addressed in the future.
  // For now, we will use a workaround by calling Bun.build on each function file individually.
  // const result = await Bun.build({
  //   entrypoints: buildCandidates,
  //   format: 'esm',
  //   minify: {
  //     syntax: true,
  //     whitespace: true,
  //   },
  //   naming: '[dir]/[name]/index.mjs', // [dir=buildDir]/[name=functionName]/index.mjs
  //   outdir: buildDir,
  //   sourcemap: 'linked',
  //   target: 'node',
  // });

  if (verbose)
    console.log(
      `Building functions with patterns: ${globPatterns.join(', ')}\nOutput directory: ${buildDir}`,
    );

  const result = await bunBuild(buildCandidates);

  if (!result.success) {
    console.error('Build failed:', result);
    process.exit(1);
  }

  console.log('Build succeeded');

  // Build Frontend
  if (!frontend) {
    if (verbose) console.log('Skipping frontend build');
    return;
  }

  await frontendBuild({
    genClient: true,
    genClientBaseUrl: '/api',
    outDir: resolve(outDir, 'frontend'),
    verbose,
  });
};

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('frontend', {
      type: 'boolean',
      description: 'Build the frontend',
      default: DEFAULTS.frontend,
    })
    .option('globPatterns', {
      type: 'array',
      description: 'Glob patterns to match function files',
      default: DEFAULTS.globPatterns,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: DEFAULTS.verbose,
      alias: 'v',
    })
    .parseSync();

  await build({ ...(argv as BuildConfig) });
}
