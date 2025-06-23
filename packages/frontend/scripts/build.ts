import { qwikVite } from '@builder.io/qwik/optimizer';
import tailwindcss from '@tailwindcss/vite';
import assert from 'node:assert';
import { resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

type BuildConfig = {
  genClient?: boolean;
  outDir?: string;
  verbose?: boolean;
};

export const build = async (configOverride: BuildConfig) => {
  const defaults: Required<BuildConfig> = {
    genClient: false,
    outDir: 'dist',
    verbose: false,
  };

  const config = { ...defaults, ...configOverride };
  const { genClient, outDir, verbose } = config;

  if (genClient) {
    if (verbose) console.log('Generating API client from OpenAPI schema...');
    const { default: generateAPIClient } = await import('./gen-client.js');
    await generateAPIClient({ reschema: true, verbose });
  }

  try {
    await viteBuild({
      build: {
        emptyOutDir: true,
        outDir,
      },
      root: resolve(__dirname, '../'),
      plugins: [
        qwikVite({
          csr: true,
        }),
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: { enabled: true },
          workbox: {
            runtimeCaching: [
              {
                urlPattern: ({ request }) =>
                  request.destination === 'document' ||
                  request.destination === 'script' ||
                  request.destination === 'style',
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'app-shell',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                  },
                },
              },
              {
                urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
                handler: 'CacheFirst',
                options: {
                  cacheName: 'assets',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
                  },
                },
              },
            ],
          },
          manifest: {
            name: 'Tally Up',
            short_name: 'Tally Up',
            start_url: '/',
            display: 'standalone',
          },
        }),
      ],
    });
  } catch (error) {
    assert(error instanceof Error, 'Build failed with an unexpected error type');
    if (error.message.includes('../client')) {
      // TODO: There must be a better way to check this
      console.error('Run again with --gen-client to generate the API client first.');
    } else {
      console.error('Build failed:', error.message);
    }
    process.exit(1);
  }
};

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('gen-client', {
      type: 'boolean',
      description: 'Generate API client from OpenAPI schema',
      default: false,
    })
    .option('outDir', {
      type: 'string',
      description: 'Output directory for the build',
      default: 'dist',
      alias: 'o',
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    })
    .parseSync();
  const { outDir, verbose } = argv;
  const genClient = argv['gen-client'];
  await build({ genClient, outDir, verbose });
}
