import { createClient, defaultPlugins } from '@hey-api/openapi-ts';
import { existsSync } from 'fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const openapiPath = path.resolve(__dirname, '../../openapi.yaml');
const clientOutputPath = path.resolve(__dirname, '../src/client');

if (import.meta.main) {
  const argv = await yargs(hideBin(process.argv))
    .option('reschema', {
      type: 'boolean',
      description: 'Regenerate the OpenAPI schema',
      default: false,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    })
    .parse();
  const { reschema } = argv;

  await generateAPIClient();
}

export type GenerateAPIClientOptions = {
  reschema?: boolean;
  verbose?: boolean;
};

export default async function generateAPIClient(opts?: GenerateAPIClientOptions) {
  const defaults: Required<GenerateAPIClientOptions> = {
    reschema: false,
    verbose: false,
  };

  const reschema = opts?.reschema ?? defaults.reschema;
  const verbose = opts?.verbose ?? defaults.verbose;

  if (reschema) {
    if (verbose) console.log('Generating OpenAPI schema...');
    Bun.spawnSync({
      cmd: ['bun', 'run', 'gen-spec'],
      cwd: path.resolve(__dirname, '../..'),
      stdout: 'inherit',
      stderr: 'inherit',
    });
  }

  if (!existsSync(openapiPath)) {
    console.error(
      `OpenAPI schema not found at ${openapiPath}. Please run with --reschema to generate it.`,
    );
    process.exit(1);
  }

  createClient({
    input: openapiPath,
    output: clientOutputPath,
    plugins: [
      ...defaultPlugins,
      {
        name: '@hey-api/client-fetch',
        runtimeConfigPath: './src/dev-utils/heyapi-config.ts', // TODO: When I wrote this, path.resolve was not working correctly
      },
    ],
  });
}
