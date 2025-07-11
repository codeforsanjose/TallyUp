import { defineConfig, type ConfigExternal } from 'orval';
import path from 'path';

type CreateOrvalConfigParams = {
  baseUrl?: string | null;
};

export const createConfigParams = (cfgOverrides?: CreateOrvalConfigParams): ConfigExternal => {
  return {
    api: {
      output: {
        baseUrl: cfgOverrides?.baseUrl || undefined,
        client: 'fetch',
        workspace: path.resolve(__dirname, './src/api/'),
        mode: 'split',
        target: './sdk.ts',
        schemas: './schemas',
      },
      input: { target: path.resolve(__dirname, './openapi.yaml') },
    },
  };
};

const defaultConfig = createConfigParams();

export default defineConfig(defaultConfig);
