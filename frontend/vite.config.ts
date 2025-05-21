import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
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
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'https://d3cwt10eg0ejzb.cloudfront.net',
        secure: false,
      },
    },
  },
});
