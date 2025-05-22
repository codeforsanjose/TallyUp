const run = async (cmd: string[], cwd: string) => {
  const proc = Bun.spawn(cmd, { cwd, stdout: 'inherit', stderr: 'inherit' });
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`❌ Command failed: ${cmd.join(' ')} (exit code ${code})`);
    process.exit(code);
  }
};

await run(['bun', 'install'], 'frontend');
await run(['bun', 'run', 'build'], 'frontend');
await run(['rm', '-rf', 'dist/static'], '.');
await run(['mkdir', '-p', 'dist/static'], '.');
await run(['cp', '-r', 'frontend/dist/*', 'dist/static/'], '.');
