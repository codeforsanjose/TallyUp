import { copyFileSync, existsSync, globSync, mkdirSync, rmdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { build } from 'htmx-pwa-frontend';

const outDir = resolve('dist');
const buildDir = resolve(outDir, 'build');

// const cacheDir = resolve(outDir, 'cache');
// TODO: Use dependency tree to calculate a hash for each function

// Build
// TODO: yargs
const globPattern = './src/*Function.ts';
const buildCandidates = globSync(globPattern, {});

if (existsSync(buildDir)) {
  rmdirSync(buildDir, { recursive: true });
}

mkdirSync(buildDir, { recursive: true });

const result = await Bun.build({
  entrypoints: buildCandidates,
  format: 'esm',
  minify: true,
  naming: '[dir]/[name]/index.mjs',
  outdir: buildDir,
  sourcemap: 'linked',
  target: 'node',
});

if (!result.success) {
  console.error('Build failed:', result);
  process.exit(1);
}

console.log('Build succeeded');

// Copy SAM template
const samTemplate = resolve(__dirname, '../template.yaml');
const samTemplateDest = resolve(outDir, 'template.yaml');
copyFileSync(samTemplate, samTemplateDest);
console.log('Moved SAM template to directory');

// Static files
const staticFiles = await build();
const staticDir = resolve(outDir, 'static');
if (existsSync(staticDir)) rmdirSync(staticDir, { recursive: true });
mkdirSync(staticDir, { recursive: true });
writeFileSync(resolve(staticDir, 'index.html'), staticFiles.html);
writeFileSync(resolve(staticDir, 'service-worker.js'), staticFiles.serviceWorker);
writeFileSync(resolve(staticDir, 'main.js'), staticFiles.mainJs);
