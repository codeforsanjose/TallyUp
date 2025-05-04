import { Entry } from './app/main';
import { boilerplate } from './lib/';
import assert from 'node:assert';

export const build = async (): Promise<{
  html: string;
  serviceWorker: string;
  mainJs: string;
}> => {
  const swArtifacts = await Bun.build({
    entrypoints: ['./src/service-worker.ts'],
    target: 'browser',
    format: 'esm',
  });
  const serviceWorker = swArtifacts.outputs[0]?.text();
  assert(serviceWorker, 'Service worker build failed');

  const mainArtifacts = await Bun.build({
    entrypoints: ['./src/main.ts'],
    target: 'browser',
    format: 'esm',
  });
  const mainJs = mainArtifacts.outputs[0]?.text();
  assert(mainJs, 'Main JS build failed');

  return { html: boilerplate(Entry), serviceWorker: await serviceWorker, mainJs: await mainJs };
};
