import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getS3BucketName } from './get-s3-bucket-name';

type DeployConfig = {
  frontend?: boolean;
  profile?: string | undefined;
  staticDir?: string;
  verbose?: boolean;
};

export const deploy = async (configOveride: DeployConfig) => {
  const defaultConfig: Required<Omit<DeployConfig, 'profile'>> = {
    frontend: true,
    staticDir: path.resolve(__dirname, '../dist/static'),
    verbose: false,
  };
  const config = { ...defaultConfig, ...configOveride };
  const { frontend, profile, staticDir, verbose } = config;

  if (verbose)
    console.log('Deployment started using options:', {
      profile,
      staticDir,
      verbose,
    });
  const validate = Bun.spawn({
    cmd: ['sam', 'validate'],
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if ((await validate.exited) !== 0) {
    console.error('SAM validation failed:', await new Response(validate.stderr).text());
    process.exit(1);
  }

  if (verbose) console.log('Validation successful, proceeding with deployment...');
  const deploy = Bun.spawn({
    cmd: ['sam', 'deploy', '--no-confirm-changeset', ...(profile ? ['--profile', profile] : [])],
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if ((await deploy.exited) !== 0) {
    console.error('SAM deployment failed:', await new Response(deploy.stderr).text());
    process.exit(1);
  }

  if (verbose) {
    console.log('SAM deployment completed successfully.');
    console.log('Fetching S3 bucket name...');
  }
  const s3BucketName = await getS3BucketName();
  if (!s3BucketName) {
    console.error('Failed to retrieve S3 bucket name from SAM stack outputs.');
    process.exit(1);
  }

  if (!frontend) {
    if (verbose) console.log('Skipping frontend build from --frontend=false');
    return;
  }

  if (verbose) console.log('Syncing static files to S3 bucket:', s3BucketName);
  const sync = Bun.spawn({
    cmd: [
      'aws',
      's3',
      'sync',
      path.resolve(staticDir),
      `s3://${s3BucketName}`,
      '--cache-control',
      'no-cache, no-store, must-revalidate',
      '--delete',
      ...(profile ? ['--profile', profile] : []),
    ],
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if ((await sync.exited) !== 0) {
    console.error('Static files sync failed:', sync.stderr);
    process.exit(1);
  }

  if (verbose) console.log('Static files synced successfully.');
};

if (import.meta.main) {
  const argv = yargs(hideBin(process.argv))
    .option('frontend', {
      type: 'boolean',
      description: 'Build the frontend',
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
    })
    .parseSync();

  const { profile, verbose } = argv;
  await deploy({ profile, verbose });
}
