import { defineConfig } from 'orval';
export default defineConfig({
  tallyUpZod: {
    output: {
      client: 'zod',
      mode: 'split',
      namingConvention: 'kebab-case',
      target: './src/gen/zod/',
      schemas: './src/gen/zod/schemas.ts',
      override: {
        zod: {
          generate: {
            body: true,
            header: true,
            param: true,
            query: true,
            response: false,
          },
        },
        useTypeOverInterfaces: true,
      },
    },
    input: {
      target: './openapi.yaml',
    },
  },
});
