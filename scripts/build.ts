import { build } from 'htmx-pwa-frontend';

import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

const buildPath = resolve(__dirname, '../dist/index.html');
await mkdir(resolve(__dirname, '../dist'), { recursive: true });
const buildContent = build();
await writeFile(buildPath, buildContent, 'utf-8')
console.log(`Build completed: ${buildPath}`);