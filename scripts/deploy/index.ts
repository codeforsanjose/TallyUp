import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getS3BucketName } from './get-s3-bucket-name';
import { pushSchema } from './push-schema';

type DeployConfig = {
  backend?: boolean;
  env: 'staging' | 'production';
  frontend?: boolean;
  profile?: string | undefined;
  staticDir?: string;
  verbose?: boolean;
};

const defaultConfig: Required<Omit<DeployConfig, 'profile' | 'env'>> = {
  backend: true,
  frontend: true,
  staticDir: path.resolve(__dirname, '../../dist/frontend'),
  verbose: false,
};

export const deploy = async (configOveride: DeployConfig) => {
  const config = { ...defaultConfig, ...configOveride };
  const { backend, env, frontend, staticDir, verbose, profile } = config;

  if (verbose) {
    console.log('Deployment started using options:', config);
  }

  // Push schema to database
  if (verbose) console.log('Pushing schema to database...');
  await pushSchema();

  // Deploy backend using AWS CDK
  const stackName = `TallyUpBackendStack${env === 'staging' ? 'Staging' : ''}`;
  const logLevel = verbose ? 'inherit' : 'pipe';
  if (!backend) {
    if (verbose) console.log('Skipping backend deploy from --backend=false');
  } else {
    const deploy = Bun.spawn({
      cmd: [
        'cdk',
        'deploy',
        '--app',
        'bun deployment',
        '--require-approval',
        'never',
        ...(profile ? ['--profile', profile] : []),
      ],
      stdout: logLevel,
      stderr: logLevel,
      env: {
        ...(process.env as Record<string, string>),
        BRANCH: env === 'staging' ? 'staging' : 'main',
        STACK_NAME: stackName,
        CUSTOM_DOMAIN_NAME:
          env === 'staging'
            ? 'staging.tallyup.opensourcesanjose.org'
            : 'tallyup.opensourcesanjose.org',
        CUSTOM_DOMAIN_CERTIFICATE_ARN:
          env === 'staging'
            ? 'arn:aws:acm:us-east-1:253016134262:certificate/926bbec6-af1d-4904-8dec-b89114ee5020'
            : 'arn:aws:acm:us-east-1:253016134262:certificate/fe98691e-f11c-45eb-84c7-64c98d6e588c',
      },
    });
    if ((await deploy.exited) !== 0) {
      console.error('Deployment failed:', await new Response(deploy.stderr).text());
      process.exit(1);
    }

    if (verbose) console.log('Deployment completed successfully.');
  }

  // Fetch S3 bucket name from stack outputs
  if (verbose) console.log('Fetching S3 bucket name...');
  const s3BucketName = await getS3BucketName(stackName, profile);
  if (!s3BucketName) {
    console.error('Failed to retrieve S3 bucket name from stack outputs.');
    process.exit(1);
  }

  // Deploy frontend static files to S3
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
    .option('env', {
      type: 'string',
      description: 'Deployment environment (staging or production)',
      choices: ['staging', 'production'] as const,
      demandOption: true,
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
