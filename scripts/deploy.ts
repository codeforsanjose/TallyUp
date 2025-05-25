import { $ } from 'bun';
import path from 'path';

console.log('SAM validation and deployment started...');
const validate = await $`sam validate`;
if (validate.exitCode !== 0) {
  console.error('SAM validation failed:', validate.stderr);
  process.exit(1);
}

const deploy = await $`sam deploy --no-confirm-changeset`;
if (deploy.exitCode !== 0) {
  console.error('SAM deployment failed:', deploy.stderr);
  process.exit(1);
}

console.log('SAM deployment completed successfully.');
console.log('Building the frontend...');
const frontBuild = await $`bun run build-frontend`;
if (frontBuild.exitCode !== 0) {
  console.error('Frontend build failed:', frontBuild.stderr);
  process.exit(1);
}

console.log('Frontend build completed successfully.');
console.log('Syncing static files...');
const staticDir = path.resolve(__dirname, '../dist/static');
const sync =
  await $`aws s3 sync ${staticDir} s3://tally-up-backend-indexdothtml-a18mqrjw3nio --cache-control "no cache, no store, must-revalidate" --delete`;
if (sync.exitCode !== 0) {
  console.error('Static files sync failed:', sync.stderr);
  process.exit(1);
}
