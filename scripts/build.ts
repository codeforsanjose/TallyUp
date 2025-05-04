import { build } from 'htmx-pwa-frontend';

import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

const outDir = resolve(__dirname, '../dist');
await mkdir(resolve(__dirname, '../dist'), { recursive: true });
const buildContent = await build();
await writeFile(resolve(outDir, 'index.html'), buildContent.html);
await writeFile(resolve(outDir, 'main.js'), buildContent.mainJs);
await writeFile(resolve(outDir, 'service-worker.js'), buildContent.serviceWorker);
console.log(`Build completed: ${outDir}`);
