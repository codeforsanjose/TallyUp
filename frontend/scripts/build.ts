import assert from 'node:assert';
import { build as viteBuild } from 'vite';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ViteConfig from '../vite.config.js';

type BuildConfig = {
  genClient?: boolean;
  outDir?: string;
  verbose?: boolean;
};

export const build = async (configOverride: BuildConfig) => {
  const defaults: Required<BuildConfig> = {
    genClient: false,
    outDir: 'dist',
    verbose: false,
  };

  const config = { ...defaults, ...configOverride };
  const { genClient, outDir, verbose } = config;

  if (genClient) {
    if (verbose) console.log('Generating API client from OpenAPI schema...');
    const { default: generateAPIClient } = await import('./gen-client.js');
    await generateAPIClient({ reschema: true, verbose });
  }

  try {
    await viteBuild({
      build: {
        emptyOutDir: true,
        outDir,
      },
      ...ViteConfig,
    });
  } catch (error) {
    assert(error instanceof Error, 'Build failed with an unexpected error type');
    if (error.message.includes('../client')) {
      // TODO: There must be a better way to check this
      console.error('Run again with --gen-client to generate the API client first.');
    } else {
      console.error('Build failed:', error.message);
    }
    process.exit(1);
  }
};

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('gen-client', {
      type: 'boolean',
      description: 'Generate API client from OpenAPI schema',
      default: false,
    })
    .option('outDir', {
      type: 'string',
      description: 'Output directory for the build',
      default: 'dist',
      alias: 'o',
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    })
    .parseSync();
  const { outDir, verbose } = argv;
  const genClient = argv['gen-client'];
  await build({ genClient, outDir, verbose });
}
