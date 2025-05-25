import { createClient, defaultPlugins } from '@hey-api/openapi-ts';
import { existsSync } from 'fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const openapiPath = path.resolve(__dirname, '../../openapi.yaml');
const clientOutputPath = path.resolve(__dirname, '../src/client');

const argv = await yargs(hideBin(process.argv))
  .option('reschema', {
    type: 'boolean',
    description: 'Regenerate the OpenAPI schema',
    default: false,
  })
  .parse();

if (argv.reschema) {
  console.log('Generating OpenAPI schema...');
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
  output: {
    path: clientOutputPath,
    clean: false, // Do not clean the output directory
    indexFile: false, // Disable index file generation
  },
  plugins: [...defaultPlugins, '@hey-api/client-fetch'],
});
