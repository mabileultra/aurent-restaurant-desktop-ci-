const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const desktopRoot = path.join(__dirname, '..');
const frontendRoot = path.join(desktopRoot, '..', 'restaurant-frontend');
const dest = path.join(desktopRoot, 'ui');
const dist = path.join(frontendRoot, 'dist');

// Same-origin via local UI proxy → relative /api/v1
const apiUrl = process.env.VITE_API_URL || '/api/v1';

if (!fs.existsSync(path.join(frontendRoot, 'package.json'))) {
  throw new Error(`restaurant-frontend not found: ${frontendRoot}`);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
if (!fs.existsSync(path.join(frontendRoot, 'node_modules'))) {
  execSync(`${npm} ci`, { cwd: frontendRoot, stdio: 'inherit', shell: true });
}

execSync(`${npm} run build`, {
  cwd: frontendRoot,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_API_URL: apiUrl },
});

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  throw new Error('restaurant-frontend build did not produce dist/index.html');
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(dist, dest, { recursive: true });
fs.writeFileSync(path.join(dest, '.gitkeep'), '');

console.log(`[restaurant-desktop] bundled UI → ${dest} (VITE_API_URL=${apiUrl})`);
