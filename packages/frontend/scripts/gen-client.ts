import { generate, type Config } from 'orval';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { createConfigParams as createOrvalConfig } from '../orval.config';

const defaults: Required<GenerateAPIClientOptions> & {} = {
  baseUrl: '',
  verbose: false,
};

if (import.meta.main) {
  const argv = await yargs(hideBin(process.argv))
    .option('base-url', {
      type: 'string',
      description: 'Base URL for the API',
      default: defaults.baseUrl,
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
  verbose?: boolean;
};

export default async function generateAPIClient(opts?: GenerateAPIClientOptions) {
  const { baseUrl, verbose } = { ...defaults, ...opts };

  if (verbose) console.log('Generating API client...');
  const defaultConfig = createOrvalConfig({ baseUrl }) as Config;
  await generate(defaultConfig['api']);
}
