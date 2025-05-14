import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { boilerplate } from '..';

// TODO: yargs
const appPath = path.resolve(__dirname, '../../app/main.ts');
const entryVarName = 'Entry';

export const build = async (): Promise<{
  html: string;
  serviceWorker: string;
  mainJs: string;
}> => {
  // Validate entry
  const appModule = await import(appPath);
  const entry: unknown = appModule[entryVarName];
  assert(
    entry && typeof entry === 'object' && !Array.isArray(entry),
    `Entry point must export a non-array object. Found: ${typeof entry}`,
  );

  // Inject imports into service worker template
  const entryFile = await fs.readFile(
    path.resolve(__dirname, '../src/service-worker.template.ts'),
    'utf-8',
  );
  const entryFileWithImport = entryFile
    .replace(
      '// __IMPORT_ENTRY_HERE__',
      `import { ${entryVarName} } from '${appPath.replaceAll('\\', '/')}';`,
    )
    .replaceAll("'__ENTRY__'", entryVarName);
  await fs.writeFile(path.resolve(__dirname, '../src/service-worker.ts'), entryFileWithImport);

  // Build
  const swArtifacts = await Bun.build({
    entrypoints: [
      path.resolve(__dirname, '../src/service-worker.ts'),
      path.resolve(__dirname, '../src/main.ts'),
    ],
    target: 'browser',
    format: 'esm',
  });
  const serviceWorker = swArtifacts.outputs[0]?.text();
  const mainJs = swArtifacts.outputs[1]?.text();
  assert(serviceWorker, 'Service worker build failed');
  assert(mainJs, 'Main JS build failed');

  return {
    html: boilerplate('<p>Loading...</p>'),
    serviceWorker: await serviceWorker,
    mainJs: await mainJs,
  };
};
