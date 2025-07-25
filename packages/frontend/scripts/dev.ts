import { createServer } from 'vite';
import { createConfig } from '../vite.config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export type DevOptions = {
  host?: string;
  verbose?: boolean;
};

const defaults: Required<DevOptions> = {
  host: 'localhost',
  verbose: false,
};

export default async function dev(opts: DevOptions) {
  const { host, verbose } = { ...defaults, ...opts };

  if (verbose) console.log('Starting development server...');
  const server = await createServer(createConfig(host));
  const listening = await server.listen(undefined, true);
  listening.printUrls();
}

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('host', {
      type: 'string',
      description: 'Host to bind the development server to',
      default: defaults.host,
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: defaults.verbose,
    })
    .parseSync();

  await dev(argv);
}
