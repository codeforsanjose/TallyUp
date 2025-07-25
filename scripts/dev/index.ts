import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import tallyupConfig from '../../tallyup.config';
import { asBunHandler } from './as-bun-handler';
import { pushSchema } from './push-schema';

type DevParams = {
  verbose?: boolean;
};

const defaults: Required<DevParams> = {
  verbose: false,
};

export default async function dev(params: DevParams = {}) {
  const { verbose } = { ...defaults, ...params };

  // Before starting the server, ensure that the environment variables are set
  process.env['AWS_REGION'] = 'us-west-2';
  process.env['AWS_ACCESS_KEY_ID'] = 'mockAccessKeyId';
  process.env['AWS_SECRET_ACCESS_KEY'] = 'mockSecretAccessKey';
  process.env['AWS_SESSION_TOKEN'] = 'mockSessionToken';

  const port = 3000;
  const result = pushSchema({ verbose });
  if (!result.success) {
    console.error('Failed to push schema:', result.error);
    process.exit(1);
  }

  console.log(`Starting Bun server on port ${port}. Try fetching http://localhost:${port}/ping`);

  const entries = await Promise.all(
    tallyupConfig.functions.map(async ({ srcDir, path, method }) => {
      const { handler } = await import(srcDir);
      return { path, method: method.toUpperCase(), handler: asBunHandler(handler) };
    }),
  );

  const routes: Record<string, Record<string, any>> = {};
  for (const { path, method, handler } of entries) {
    (routes[path] ??= {})[method] = async (req: Bun.BunRequest) => {
      try {
        return await handler(req);
      } catch (e) {
        return new Response((e as Error).message + ' ' + (e as Error).stack, {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
    };
  }

  Bun.serve({
    hostname: '0.0.0.0',
    routes: {
      '/ping': () => new Response('pong'),
      ...routes,
    },
    port,
    fetch: (_req) => {
      return new Response(null, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    },
  });
}

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('verbose', {
      type: 'boolean',
      description: 'Run with verbose logging',
      default: false,
      alias: 'v',
    })
    .parseSync();

  await dev(argv);
}
