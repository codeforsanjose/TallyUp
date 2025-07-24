export const pushSchema = (params: {
  verbose: boolean;
}): { success: true } | { success: false; error: Error } => {
  const { verbose } = params;
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) throw new Error('DATABASE_URL is not defined in environment variables');
  const ioString = verbose ? 'inherit' : 'pipe';
  // Then use bunx drizzle-kit push to push the schema to the database
  const pushProcess = Bun.spawnSync(['bunx', 'drizzle-kit', 'push', '--force', '--strict=false'], {
    cwd: process.cwd(),
    env: {
      ...(process.env as Record<string, string>),
      DATABASE_URL: connectionString,
    },
    stderr: 'pipe',
    stdout: 'inherit',
  });
  const errorMaybe = pushProcess.stderr.toString();
  if (errorMaybe) {
    return { success: false, error: new Error(errorMaybe) };
  }
  if (pushProcess.exitCode !== 0) {
    return { success: false, error: new Error('Error pushing schema to database') };
  }

  if (verbose) console.log('Schema pushed to database successfully');
  return {
    success: true,
  };
};
