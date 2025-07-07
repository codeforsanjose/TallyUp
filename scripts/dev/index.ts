import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { handler as loginHandler } from '../../src/loginFunction';
import { handler as refreshTokenFunction } from '../../src/refreshTokenFunction';
import { handler as registerHandler } from '../../src/registerFunction';
import { handler as resendVerificationEmailFunction } from '../../src/resendVerificationEmailFunction';
import { handler as verifyEmailHandler } from '../../src/verifyEmailFunction';
import { asBunHandler } from './as-bun-handler';
import { pushSchema } from './push-schema';
// @ts-ignore

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
  Bun.serve({
    hostname: '0.0.0.0',
    routes: {
      '/api/register': { POST: asBunHandler(registerHandler) },
      '/api/login': { POST: asBunHandler(loginHandler) },
      '/api/refresh-token': { POST: asBunHandler(refreshTokenFunction) },
      '/api/resend-verification-email': asBunHandler(resendVerificationEmailFunction),
      '/api/verify-email': asBunHandler(verifyEmailHandler),
      '/ping': () => new Response('pong'),
    },
    port,
    fetch: (_req) => {
      return new Response(null, {
        status: 204,
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
