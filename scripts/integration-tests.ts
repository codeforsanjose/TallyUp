import { downMany, logs, upMany } from 'docker-compose';
import path from 'path';
import { client } from '../tests/integration/db-client';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createWriteStream } from 'fs';

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
  outLog?: boolean;
  verbose?: boolean;
};

const defaults: Required<IntegrationTestArgs> = {
  filePaths: ['tests/integration/'],
  outLog: false,
  verbose: false,
};

export const integrationTests = async (argv: IntegrationTestArgs) => {
  const { filePaths, outLog, verbose } = { ...defaults, ...argv };

  try {
    if (verbose) console.log('Tearing down existing services...');
    await teardownServices();
  } catch (e) {
    // Ignore errors
  }

  if (verbose) console.log('Starting up services...');
  await upMany(['db', 'api', 'neonDbProxy'], {
    cwd: path.resolve(__dirname, '../'),
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: 'dx-test',
    } as unknown as NodeJS.ProcessEnv,
  });
  if (outLog) {
    console.log('Outputting docker logs to docker.log');
    const outStream = createWriteStream('docker.log');
    logs('api', {
      follow: true,
      cwd: path.resolve(__dirname, '../'),
      env: {
        ...process.env,
        COMPOSE_PROJECT_NAME: 'dx-test',
      } as unknown as NodeJS.ProcessEnv,
      callback: (chunk) => {
        outStream.write(chunk);
      },
    });
  }

  // Wait until api /ping endpoint is available
  if (verbose) console.log('Waiting for API to start...');
  let apiStarted = false;
  const tries = 30;
  let attempt = 0;
  while (!apiStarted && attempt < tries) {
    try {
      const constroller = new AbortController();
      const { signal } = constroller;
      setTimeout(() => constroller.abort(), 1000);
      const response = await fetch('http://localhost:3000/ping', { signal });

      if (response.ok) {
        apiStarted = true;
      }
    } catch (error) {
      if (attempt >= tries) {
        console.error('API did not start in time');
        throw error;
      }
      if (verbose) console.error(`Attempt ${attempt + 1} failed: ${error}`);
    }

    attempt++;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!apiStarted) throw new Error('API did not start in time');
  if (verbose) console.log('API started successfully');

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

// Run integration tests if this file is executed directly
if (import.meta.main) {
  await yargs(hideBin(process.argv))
    .command(
      '* [filePaths...]',
      'Run integration tests',
      (yargs) => {
        return yargs
          .positional('filePaths', {
            array: true,
            type: 'string',
            describe: 'Paths to specific test files to run',
            default: defaults.filePaths,
          })
          .option('out-log', {
            type: 'boolean',
            default: defaults.outLog,
            describe: 'Output docker logs to a file',
          })
          .option('verbose', {
            type: 'boolean',
            default: defaults.verbose,
            describe: 'Run tests in verbose mode',
            alias: 'v',
          })
          .strict();
      },
      (argv) => integrationTests(argv),
    )
    .parseAsync();
}
