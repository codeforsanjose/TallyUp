import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getS3BucketName } from './get-s3-bucket-name';

type DeployConfig = {
  backend?: boolean;
  frontend?: boolean;
  profile?: string | undefined;
  staticDir?: string;
  verbose?: boolean;
};

const defaultConfig: Required<Omit<DeployConfig, 'profile'>> = {
  backend: true,
  frontend: true,
  staticDir: path.resolve(__dirname, '../../dist/frontend'),
  verbose: false,
};

export const deploy = async (configOveride: DeployConfig) => {
  const config = { ...defaultConfig, ...configOveride };
  const { backend, frontend, staticDir, verbose, profile } = config;

  if (verbose) {
    console.log('Deployment started using options:', config);
  }

  const logLevel = verbose ? 'inherit' : 'pipe';
  if (!backend) {
    if (verbose) console.log('Skipping backend deploy from --backend=false');
  } else {
    const deploy = Bun.spawn({
      cmd: [
        'sam',
        'deploy',
        '--no-confirm-changeset',
        '--no-fail-on-empty-changeset',
        ...(profile ? ['--profile', profile] : []),
      ],
      stdout: logLevel,
      stderr: logLevel,
    });
    if ((await deploy.exited) !== 0) {
      console.error('SAM deployment failed:', await new Response(deploy.stderr).text());
      process.exit(1);
    }

    if (verbose) console.log('SAM deployment completed successfully.');
  }
  if (verbose) console.log('Fetching S3 bucket name...');
  const s3BucketName = await getS3BucketName(profile);
  if (!s3BucketName) {
    console.error('Failed to retrieve S3 bucket name from SAM stack outputs.');
    process.exit(1);
  }

  if (!frontend) {
    if (verbose) console.log('Skipping frontend deploy from --frontend=false');
    return;
  }

  if (verbose) console.log('Syncing static files to S3 bucket:', s3BucketName);
  const sync = Bun.spawn({
    cmd: [
      'aws',
      's3',
      'sync',
      path.resolve(staticDir),
      s3BucketName,
      '--cache-control',
      'no-cache, no-store, must-revalidate',
      '--delete',
      ...(profile ? ['--profile', profile] : []),
    ],
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if ((await sync.exited) !== 0) {
    console.error('Static files sync failed:', await new Response(sync.stderr).text());
    process.exit(1);
  }

  if (verbose) console.log('Static files synced successfully.');
};

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('backend', {
      type: 'boolean',
      description: 'Deploy the backend',
      default: true,
    })
    .option('frontend', {
      type: 'boolean',
      description: 'Deploy the frontend',
      default: true,
    })
    .option('profile', {
      type: 'string',
      description: 'AWS profile to use for deployment',
    })
    .option('verbose', {
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
      alias: 'v',
    })
    .parseSync();

  await deploy(argv);
}
