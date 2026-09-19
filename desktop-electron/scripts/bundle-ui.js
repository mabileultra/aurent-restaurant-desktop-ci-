const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const desktopRoot = path.join(__dirname, '..');
const frontendRoot = path.join(desktopRoot, '..', 'web-frontend');
const dest = path.join(desktopRoot, 'ui');
const dist = path.join(frontendRoot, 'dist');

if (!fs.existsSync(path.join(frontendRoot, 'package.json'))) {
  throw new Error(`web-frontend not found: ${frontendRoot}`);
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
if (!fs.existsSync(path.join(frontendRoot, 'node_modules'))) {
  execSync(`${npm} ci`, { cwd: frontendRoot, stdio: 'inherit', shell: true });
}

execSync(`${npm} run build`, { cwd: frontendRoot, stdio: 'inherit', shell: true });

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  throw new Error('web-frontend build did not produce dist/index.html');
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(dist, dest, { recursive: true });
fs.writeFileSync(path.join(dest, '.gitkeep'), '');

console.log(`[bundle-ui] copied ${dist} → ${dest}`);
