import { existsSync } from 'fs';
import { generate, type Config } from 'orval';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { createConfigParams as createOrvalConfig } from '../orval.config';

const defaults: Required<GenerateAPIClientOptions> & {} = {
  baseUrl: '',
  reschema: false,
  specPath: path.resolve(__dirname, '../openapi.yaml'),
  verbose: false,
};

if (import.meta.main) {
  const argv = await yargs(hideBin(process.argv))
    .option('base-url', {
      type: 'string',
      description: 'Base URL for the API',
      default: defaults.baseUrl,
    })
    .option('reschema', {
      type: 'boolean',
      description: 'Regenerate the OpenAPI schema',
      default: false,
    })
    .option('spec-path', {
      type: 'string',
      description: 'Path to the OpenAPI spec file',
      default: defaults.specPath,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    })
    .parse();

  await generateAPIClient(argv);
}

export type GenerateAPIClientOptions = {
  baseUrl?: string | null;
  reschema?: boolean;
  specPath?: string;
  verbose?: boolean;
};

export default async function generateAPIClient(opts?: GenerateAPIClientOptions) {
  const { baseUrl, reschema, specPath, verbose } = { ...defaults, ...opts };
  if (reschema) {
    const generateSpec = (await import('../../scripts/gen-spec')).default;
    if (existsSync(specPath)) {
      if (verbose) console.log(`Removing existing OpenAPI spec at ${specPath}`);
      Bun.file(specPath).unlink();
    }

    if (verbose) console.log('Generating OpenAPI spec...');
    await generateSpec({ outputFile: specPath });
    if (verbose) console.log(`OpenAPI spec generated at ${specPath}`);
  }

  if (verbose) console.log('Generating API client...');
  const defaultConfig = createOrvalConfig({ baseUrl }) as Config;
  await generate(defaultConfig['api']);
}
