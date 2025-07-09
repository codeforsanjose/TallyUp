import { downMany, upMany } from 'docker-compose';
import path from 'path';
import { client } from '../tests/integration/db-client';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const teardownServices = async () => {
  await downMany(['db', 'api', 'neonDbProxy'], {
    cwd: path.resolve(__dirname, '../'),
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: 'dx-test',
    } as unknown as NodeJS.ProcessEnv,
    commandOptions: ['-v', '--remove-orphans'],
  });
};

type IntegrationTestArgs = {
  filePaths?: string[];
};

const defaults: Required<IntegrationTestArgs> = {
  filePaths: ['tests/integration/'],
};

export const integrationTests = async (argv: IntegrationTestArgs) => {
  const { filePaths } = { ...defaults, ...argv };

  try {
    await teardownServices();
  } catch (e) {
    // Ignore errors
  }

  await upMany(['db', 'api', 'neonDbProxy'], {
    cwd: path.resolve(__dirname, '../'),
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

  if (!apiStarted) throw new Error('API did not start in time');

  // Run integration tests
  const integrationTestProcess = Bun.spawn({
    cmd: ['bun', 'test', ...filePaths],
    stdout: 'inherit',
    stderr: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    } as unknown as NodeJS.ProcessEnv,
  });
  const exitCode = await integrationTestProcess.exited;
  if (exitCode !== 0) {
    console.error(`Integration tests failed with exit code ${exitCode}`);
    await client.$client.end();
    await teardownServices();
    process.exit(exitCode);
  }

  console.log('Integration tests passed');
  await client.$client.end();
  await teardownServices();
  process.exit(0);
};

if (import.meta.main) {
  await yargs(hideBin(process.argv))
    .command(
      '* [filePaths...]',
      'Run integration tests',
      (yargs) => {
        return yargs.positional('filePaths', {
          array: true,
          type: 'string',
          describe: 'Paths to specific test files to run',
          default: defaults.filePaths,
        });
      },
      (argv) => integrationTests(argv),
    )
    .parseAsync();
}
