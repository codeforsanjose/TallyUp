import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import tailwindcss from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    qwikVite({
      csr: true,
    }),
    tailwindcss(),
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
