export const getS3BucketName = async (stackName: string, profile?: string) => {
  const process = Bun.spawn({
    cmd: [
      'aws',
      'cloudformation',
      'describe-stacks',
      '--stack-name=' + stackName,
      '--query',
      'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue',
      '--output=text',
      ...(profile ? ['--profile', profile] : []),
    ],
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const exitCode = await process.exited;
  if (exitCode !== 0) {
    console.error('Failed to list stack outputs:', await new Response(process.stderr).text());
    return undefined;
  }

  return new Response(process.stdout).text();
};
