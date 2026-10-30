const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const desktopRoot = path.join(__dirname, '..');
const frontendRoot = path.join(desktopRoot, '..', 'restaurant-frontend');
const dest = path.join(desktopRoot, 'ui-restaurant');
const dist = path.join(frontendRoot, 'dist');

if (!fs.existsSync(path.join(frontendRoot, 'package.json'))) {
  throw new Error(`restaurant-frontend not found: ${frontendRoot}`);
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
if (!fs.existsSync(path.join(frontendRoot, 'node_modules'))) {
  execSync(`${pnpm} install`, { cwd: frontendRoot, stdio: 'inherit', shell: true });
}

execSync(`${pnpm} run build`, { cwd: frontendRoot, stdio: 'inherit', shell: true });

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  throw new Error('restaurant-frontend build did not produce dist/index.html');
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(dist, dest, { recursive: true });
fs.writeFileSync(path.join(dest, '.gitkeep'), '');

console.log(`[bundle-restaurant-ui] copied ${dist} → ${dest}`);
