import generate from 'orval';
import path from 'path';
import { postinstall as frontPostInstall } from 'frontend';

export const postinstall = async () => {
  const argon2Install = Bun.spawn({
    cmd: ['bun', 'install'],
    cwd: path.resolve(__dirname, '../../layers/argon2/nodejs'),
    stdout: 'inherit',
    stderr: 'inherit',
  });
  await argon2Install.exited;

  await generate();

  await frontPostInstall({});
};

if (import.meta.main) {
  await postinstall();
  console.log('Post-installation tasks completed successfully.');
}
