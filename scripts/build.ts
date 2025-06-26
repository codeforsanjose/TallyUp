import { build as frontendBuild } from 'frontend';
import { existsSync, globSync, mkdirSync, rmdirSync } from 'fs';
import { resolve } from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const outDir = resolve('dist');
const buildDir = resolve(outDir, 'build');

// const cacheDir = resolve(outDir, 'cache');
// TODO: Use dependency tree to calculate a hash for each function

export type BuildConfig = {
  globPatterns?: string[];
  verbose?: boolean;
};

const DEFAULTS: Required<BuildConfig> = {
  globPatterns: ['./src/*Function.ts'],
  verbose: false,
};

export const build = async (cfg: BuildConfig) => {
  const config = { ...DEFAULTS, ...cfg };
  const { globPatterns, verbose } = config;

  const buildCandidates = globPatterns.flatMap((pattern) => globSync(pattern, {}));

  if (existsSync(buildDir)) {
    if (verbose) console.log(`Removing existing build directory: ${buildDir}`);
    rmdirSync(buildDir, { recursive: true });
  }

  mkdirSync(buildDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: buildCandidates,
    format: 'esm',
    minify: {
      syntax: true,
      whitespace: true,
    },
    naming: '[dir]/[name]/index.mjs',
    outdir: buildDir,
    sourcemap: 'linked',
    target: 'node',
  });

  if (!result.success) {
    console.error('Build failed:', result);
    process.exit(1);
  }

  console.log('Build succeeded');

  // Build Frontend
  await frontendBuild({
    outDir: resolve(outDir, 'frontend'),
    verbose,
  });
};

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('globPatterns', {
      type: 'array',
      description: 'Glob patterns to match function files',
      default: DEFAULTS.globPatterns,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: DEFAULTS.verbose,
    })
    .parseSync();

  await build({
    globPatterns: argv.globPatterns as string[],
    verbose: argv.verbose as boolean,
  });
}
