type SamStackOutput = {
  OutputKey: string;
  OutputValue: string;
};

export const getS3BucketName = async (profile?: string) => {
  const process = Bun.spawn({
    cmd: ['sam', 'list', 'stack-outputs', ...(profile ? ['--profile', profile] : [])],
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const exitCode = await process.exited;
  if (exitCode !== 0) {
    console.error('Failed to list SAM stack outputs:', await new Response(process.stderr).text());
    return undefined;
  }

  const outputs: SamStackOutput[] = await new Response(process.stdout).json();
  return outputs.find((o) => o.OutputKey === 'S3BucketName')?.OutputValue;
};
