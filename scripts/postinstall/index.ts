import path from 'path';
import archiver from 'archiver';
import fs from 'fs';

const zipDir = async () => {
  const argon2ZipTarget = path.resolve(__dirname, '../../layers/argon2/argon2-layer.zip');

  if (fs.existsSync(argon2ZipTarget)) {
    fs.rmSync(argon2ZipTarget);
  }

  const argon2Zip = fs.createWriteStream(argon2ZipTarget);
  const argon2Archive = archiver('zip', {
    zlib: { level: 9 }, // Set the compression level
  });
  argon2Archive.pipe(argon2Zip);
  argon2Archive.directory(path.resolve(__dirname, '../../layers/argon2/nodejs/'), false);

  await new Promise<void>((resolve, reject) => {
    argon2Zip.on('close', resolve);
    argon2Archive.on('error', reject);
    argon2Archive.finalize();
  });
};

export const postinstall = async () => {
  const argon2Install = Bun.spawn({
    cmd: ['bun', 'install'],
    cwd: path.resolve(__dirname, '../../layers/argon2/nodejs'),
    stdout: 'inherit',
    stderr: 'inherit',
  });
  await argon2Install.exited;

  await zipDir();

  const frontendInstall = Bun.spawn({
    cmd: ['bun', 'install'],
    cwd: path.resolve(__dirname, '../../frontend'),
    stdout: 'inherit',
    stderr: 'inherit',
  });
  await frontendInstall.exited;
};

if (import.meta.main) {
  await postinstall();
  console.log('Post-installation tasks completed successfully.');
}
