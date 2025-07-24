import assert from 'node:assert';
import { build as viteBuild } from 'vite';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ViteConfig from '../vite.config.js';

type BuildConfig = {
  genClient?: boolean;
  genClientBaseUrl?: string | null;
  outDir?: string;
  verbose?: boolean;
};

export const build = async (configOverride: BuildConfig) => {
  console.log('Starting build process...');

  const defaults: Required<BuildConfig> = {
    genClient: false,
    genClientBaseUrl: null,
    outDir: 'dist',
    verbose: false,
  };

  const config = { ...defaults, ...configOverride };
  const { genClient, genClientBaseUrl, outDir, verbose } = config;

  if (genClient) {
    if (verbose) console.log('Generating API client from OpenAPI schema...');
    const { default: generateAPIClient } = await import('./gen-client.js');
    await generateAPIClient({ baseUrl: genClientBaseUrl, verbose });
  }

  try {
    await viteBuild({
      build: {
        emptyOutDir: true,
        outDir,
      },
      logLevel: verbose ? 'info' : 'error',
      ...ViteConfig,
    });

    console.log(`Build completed successfully. Output directory: ${outDir}`);
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
    .option('genClientBaseUrl', {
      type: 'string',
      description: 'Base URL for the generated API client',
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
    .strict()
    .parseSync();
  const { outDir, verbose } = argv;
  const genClient = argv['gen-client'];
  await build({ genClient, outDir, verbose });
}
