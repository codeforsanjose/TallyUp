import { afterAll, beforeAll, expect, test } from 'bun:test';
import { downMany, upMany } from 'docker-compose';
import path from 'path';

beforeAll(async () => {
  await upMany(['db', 'api', 'neonDbProxy'], {
    cwd: path.resolve(__dirname, '../../'),
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: 'dx-test',
    } as unknown as NodeJS.ProcessEnv,
  });

  // Wait until api prints "Try fetching {url}"
  let apiStarted = false;
  const tries = 30;
  let attempt = 0;
  while (!apiStarted && attempt < tries) {
    const logStream = Bun.spawnSync({
      cmd: ['docker', 'logs', 'dx-test-api-1'],
      cwd: path.resolve(__dirname, '../../'),
      env: {
        ...process.env,
        COMPOSE_PROJECT_NAME: 'dx-test',
      } as unknown as NodeJS.ProcessEnv,
      stdout: 'pipe',
      stderr: 'pipe',
    }).stdout.toString();

    if (logStream.includes('Try fetching')) {
      apiStarted = true;
      console.log('API started, running tests...');
      break;
    }

    attempt++;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!apiStarted) {
    throw new Error('API did not start in time');
  }
});

afterAll(async () => {
  // Stop the docker containers after the tests
  await downMany(['db', 'api', 'neonDbProxy'], {
    cwd: path.resolve(__dirname, '../../'),
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: 'dx-test',
    } as unknown as NodeJS.ProcessEnv,
    commandOptions: ['-v', '--remove-orphans'],
  });
});

test('API starts', async () => {
  const response = await fetch('http://localhost:3000/ping');
  expect(response.status).toBe(200);
  const data = await response.text();
  expect(data).toBe('pong');
});
