#!/usr/bin/env node
/**
 * Собирает @thiagoelg/node-printer под версию Electron из desktop-cashier.
 * Вызывается при npm install (postinstall) и перед dist:win / CI.
 * Кассиру после установки .exe ничего запускать не нужно.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const required = process.argv.includes('--required') || process.env.REQUIRE_NATIVE_PRINTER === '1';
const skip = process.env.SKIP_NATIVE_PRINTER === '1';
const isDarwin = process.platform === 'darwin';
const isWin32 = process.platform === 'win32';

function log(msg) {
  console.log(`[desktop-cashier] ${msg}`);
}

function readDependencySpec(name) {
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.optionalDependencies };
  return deps[name] || name;
}

function moduleDir(name) {
  return path.join(root, 'node_modules', ...name.split('/'));
}

/** optionalDependency может отсутствовать, если install/prebuild упал при npm ci. */
function ensureNativePackage(name) {
  const dir = moduleDir(name);
  if (fs.existsSync(dir)) {
    return true;
  }

  const spec = `${name}@${readDependencySpec(name)}`;
  log(`Пакет ${name} не найден — npm install ${spec} --ignore-scripts`);
  const npm = isWin32 ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    npm,
    ['install', spec, '--ignore-scripts', '--no-audit', '--no-fund'],
    { cwd: root, stdio: 'inherit', shell: isWin32 },
  );
  if (result.status !== 0) {
    console.error(`[desktop-cashier] Не удалось установить ${name}`);
    return false;
  }
  if (!fs.existsSync(dir)) {
    console.error(`[desktop-cashier] ${name} установлен, но каталог не найден: ${dir}`);
    return false;
  }
  return true;
}

if (skip) {
  log('SKIP_NATIVE_PRINTER=1 — пропуск сборки драйвера принтера');
  process.exit(0);
}

/** ESC/POS на кассах — только Windows; Mac .dmg без native-модуля. */
if (isDarwin && !required) {
  log('macOS — пропуск @thiagoelg/node-printer (печать чека только в Windows .exe)');
  process.exit(0);
}

const electronPkg = path.join(root, 'node_modules', 'electron', 'package.json');
if (!fs.existsSync(electronPkg)) {
  const msg = 'electron не установлен — сборка native-принтера отложена';
  if (required) {
    console.error(`[desktop-cashier] ${msg}`);
    process.exit(1);
  }
  log(`${msg} (нормально для npm install --omit=dev)`);
  process.exit(0);
}

const printerName = '@thiagoelg/node-printer';
if (!fs.existsSync(moduleDir(printerName))) {
  if (required && isWin32 && ensureNativePackage(printerName)) {
    log('Пакет принтера установлен, продолжаем electron-rebuild');
  } else {
    const msg = 'Пакет @thiagoelg/node-printer не найден. Выполните: npm install';
    console.error(`[desktop-cashier] ${msg}`);
    process.exit(required ? 1 : 0);
  }
}

const nativeModules = [printerName];
const serialName = 'serialport';
if (fs.existsSync(moduleDir(serialName))) {
  nativeModules.push(serialName);
} else if (required && isWin32 && ensureNativePackage(serialName)) {
  nativeModules.push(serialName);
}

log(`Сборка native-модулей для Electron: ${nativeModules.join(', ')}…`);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let printerFailed = false;
let lastStatus = 0;

for (const mod of nativeModules) {
  log(`@electron/rebuild -w ${mod}`);
  const result = spawnSync(
    npx,
    ['@electron/rebuild', '-f', '-w', mod],
    { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (result.status === 0) {
    continue;
  }
  lastStatus = result.status || 1;
  if (mod === 'serialport') {
    console.warn('[desktop-cashier] serialport не собран — весы по COM могут не работать');
    continue;
  }
  printerFailed = true;
  break;
}

if (!printerFailed) {
  log('Native-модули (принтер, весы) для Electron готовы');
  process.exit(0);
}

const result = { status: lastStatus };

const hint =
  'Не удалось собрать драйвер ESC/POS. На Windows: Visual Studio Build Tools, затем npm run rebuild:native --required';

if (required) {
  console.error(`[desktop-cashier] ${hint}`);
  process.exit(result.status || 1);
}

console.warn(`[desktop-cashier] ${hint}`);
console.warn('[desktop-cashier] ESC/POS на этой машине может не работать до успешной сборки установщика на Windows');
process.exit(0);
