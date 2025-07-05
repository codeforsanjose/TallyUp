import { resolve } from 'path';
import { generateOpenApiSpec } from '../src/lib';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

type GenerateSpecOptions = {
  outputFile?: string;
};

export default async function generateSpec(opts: GenerateSpecOptions) {
  const defaults: Required<GenerateSpecOptions> = {
    outputFile: resolve(__dirname, '../openapi.yaml'),
  };

  const { outputFile } = { ...defaults, ...opts };
  const result = await generateOpenApiSpec();
  await Bun.file(resolve(outputFile)).write(result);
}

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('outputFile', {
      type: 'string',
      description: 'Output file for the OpenAPI spec',
      default: resolve(__dirname, '../openapi.yaml'),
      alias: 'o',
    })
    .parseSync();
  await generateSpec(argv);
}
