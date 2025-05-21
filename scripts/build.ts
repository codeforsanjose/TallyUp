import { copyFileSync, existsSync, globSync, mkdirSync, rmdirSync } from 'fs';
import { resolve } from 'path';

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
  minify: {
    syntax: true,
    whitespace: true,
  },
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
