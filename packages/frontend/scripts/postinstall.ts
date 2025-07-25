import yargs from 'yargs';
import generateAPIClient from './gen-client';
import { hideBin } from 'yargs/helpers';

const defaults = {
  verbose: false,
};

export const postinstall = async (overrides: { verbose?: boolean }) => {
  const { verbose } = { ...defaults, ...overrides };
  // generate client
  console.log('Generating API client from OpenAPI schema...');

  await generateAPIClient({
    baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api' : '/api',
    verbose,
  });
};
if (import.meta.main) {
  const argv = await yargs(hideBin(process.argv))
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: defaults.verbose,
    })
    .parse();

  await postinstall(argv);
}
