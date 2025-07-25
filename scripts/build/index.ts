import { existsSync, globSync, mkdirSync, rmdirSync } from 'fs';
import { resolve } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { build as frontendBuild } from 'frontend';
import { bunBuild } from './build-lambdas';
import { zipArgon2 } from './zip-argon2';

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
  globPatterns: ['./src/*-function.ts'],
  verbose: false,
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

  if (verbose)
    console.log(
      `Building functions with patterns: ${globPatterns.join(', ')}\nOutput directory: ${buildDir}`,
    );

  const result = await bunBuild({
    entrypoints: buildCandidates,
    buildDir,
  });

  if (!result.success) {
    console.error('Build failed:', result);
    process.exit(1);
  }

  console.log('Build succeeded');

  await zipArgon2();

  // Build Frontend
  if (!frontend) {
    if (verbose) console.log('Skipping frontend build');
    return;
  }

  await frontendBuild({
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
