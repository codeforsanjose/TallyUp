import path from 'node:path';
import { boilerplate } from '..';
import assert from 'node:assert';
import fs from 'node:fs/promises';

const entryPath = path.resolve(__dirname, '../../app/main.ts').replace(/\\/g, '/');

export const build = async (): Promise<{
  html: string;
  serviceWorker: string;
  mainJs: string;
}> => {
  const Entry = (await import(entryPath)).default;
  const importStatement = `import Entry from '${entryPath}';`;
  const entryFile = await fs.readFile(
    path.resolve(__dirname, '../src/service-worker.template.ts'),
    'utf-8',
  );
  const entryFileWithImport = entryFile
    .replace('// __IMPORT_ENTRY_HERE__', importStatement)
    .replace('`__ENTRY_HERE__`', 'Entry');
  await fs.writeFile(path.resolve(__dirname, '../src/service-worker.ts'), entryFileWithImport);

  const swArtifacts = await Bun.build({
    entrypoints: [path.resolve(__dirname, '../src/service-worker.ts')],
    target: 'browser',
    format: 'esm',
  });
  const serviceWorker = swArtifacts.outputs[0]?.text();
  assert(serviceWorker, 'Service worker build failed');

  const mainArtifacts = await Bun.build({
    entrypoints: [path.resolve(__dirname, '../src/main.ts')],
    target: 'browser',
    format: 'esm',
  });
  const mainJs = mainArtifacts.outputs[0]?.text();
  assert(mainJs, 'Main JS build failed');

  return {
    html: boilerplate(Entry),
    serviceWorker: await serviceWorker,
    mainJs: await mainJs,
  };
};
