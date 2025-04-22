import { execSync } from 'child_process';
import { cpSync } from 'fs';
import path from 'path';

const frontendPath = path.join(__dirname, '../../frontend/');
const backendPath = path.join(__dirname, '../');
const outputPath = path.join(__dirname, '../dist/');

try {
  console.log('🛠️ Building static files');
  execSync('npm run build', {
    cwd: frontendPath,
    stdio: 'inherit',
  });

  console.log('📦 Copying static files to backend dist folder');
  cpSync(path.join(frontendPath, 'dist'), outputPath, { recursive: true, force: true });

  console.log('🚀 Building SAM application');
  execSync('sam build', {
    cwd: backendPath,
    stdio: 'inherit',
  });
} catch (error) {
  console.error('❌ Build failed:', JSON.stringify(error, null, 2));
  process.exit(1);
}