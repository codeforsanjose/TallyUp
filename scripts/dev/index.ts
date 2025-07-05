import express from 'express';
import { handler as loginHandler } from '../../src/loginFunction';
import { handler as refreshTokenFunction } from '../../src/refreshTokenFunction';
import { handler as registerHandler } from '../../src/registerFunction';
import { handler as resendVerificationEmailFunction } from '../../src/resendVerificationEmailFunction';
import { handler as verifyEmailHandler } from '../../src/verifyEmailFunction';
import { mockApiGatewayEvent } from './mock-api-gateway-event';
import { waitForPostgres } from './wait-for-postgres';
import cors from 'cors';

export default async function dev() {
  // Before starting the server, ensure that the environment variables are set
  process.env['AWS_REGION'] = 'us-west-2';
  process.env['AWS_ACCESS_KEY_ID'] = 'mockAccessKeyId';
  process.env['AWS_SECRET_ACCESS_KEY'] = 'mockSecretAccessKey';
  process.env['AWS_SESSION_TOKEN'] = 'mockSessionToken';

  const port = 3000;

  // Then use bunx drizzle-kit push to push the schema to the database
  await waitForPostgres('postgres://postgres@db:5432/postgres', 10, 1000);
  const pushProcess = Bun.spawnSync(['bunx', 'drizzle-kit', 'push'], {
    cwd: process.cwd(),
    env: {
      ...(process.env as Record<string, string>),
      DATABASE_URL: 'postgres://postgres@db:5432/postgres',
    },
  });
  if (pushProcess.exitCode !== 0) {
    console.error('Error pushing schema to database:', pushProcess.stdout.toString());
    process.exit(pushProcess.exitCode);
  }

  const app = express();
  app.use(express.raw({ type: '*/*' }));
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.all('/*splat', async (req, res) => {
    const routes = {
      'POST /api/register': registerHandler,
      'POST /api/login': loginHandler,
      'POST /api/refresh-token': refreshTokenFunction,
      'GET /api/resend-verification-email': resendVerificationEmailFunction,
      'GET /api/verify-email': verifyEmailHandler,
    };
    const event = mockApiGatewayEvent(req);

    const routeKey = `${req.method} ${req.path}`;
    if (routeKey in routes) {
      try {
        const response = await routes[routeKey as keyof typeof routes](event);
        res
          .status(response.statusCode || 500)
          .json(JSON.parse(response.body || 'No body, this should never happen'));
      } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      console.warn(`No handler found for route: ${routeKey}`);
      res.status(404).json({ error: 'Not Found' });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('Available routes:');
    console.log('POST /api/register');
    console.log('POST /api/login');
    console.log('POST /api/refresh-token');
    console.log('POST /api/resend-verification-email');
    console.log('GET /api/verify-email');
  });
}

if (import.meta.main) {
  await dev();
}
