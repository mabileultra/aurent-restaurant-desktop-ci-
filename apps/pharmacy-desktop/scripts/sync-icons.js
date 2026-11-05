#!/usr/bin/env node
/**
 * Иконки Electron: desktop/icon.png (прозрачный Aurent) → icon.png, icon.ico
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_ICON = path.join(ROOT, '..', 'web-frontend', 'public', 'desktop', 'icon.png');
const BRAND_APP = path.join(ROOT, '..', 'web-frontend', 'public', 'brand', 'app-icon.png');
const SVG = path.join(ROOT, '..', 'web-frontend', 'public', 'desktop', 'icon.svg');
const LOGO2 = path.join(ROOT, '..', 'web-frontend', 'public', 'brand', 'logo2.png');
const BUILD = path.join(ROOT, 'build');

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function loadSharp() {
  try {
    return require('sharp');
  } catch {
    console.error('sharp not installed — run pnpm install in desktop-electron');
    process.exit(1);
  }
}

function resolveSource() {
  if (fs.existsSync(APP_ICON)) return APP_ICON;
  if (fs.existsSync(BRAND_APP)) return BRAND_APP;
  if (fs.existsSync(SVG)) return SVG;
  if (fs.existsSync(LOGO2)) return LOGO2;
  console.error('Missing icon source:', APP_ICON);
  process.exit(1);
}

async function resizePng(sharp, source, size) {
  return sharp(source)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function writeIco(sharp, source) {
  const pngToIco = require('png-to-ico');
  const buffers = await Promise.all(
    ICO_SIZES.map((size) => resizePng(sharp, source, size)),
  );
  const ico = await pngToIco(buffers);
  const icoPath = path.join(BUILD, 'icon.ico');
  fs.writeFileSync(icoPath, ico);

  if (ico.length < 1024) {
    throw new Error(`icon.ico too small (${ico.length} bytes)`);
  }
  console.log(`  icon.ico (${ICO_SIZES.join(', ')}px, ${ico.length} bytes)`);
}

async function writePng512(sharp, source) {
  const png512 = await resizePng(sharp, source, 512);
  fs.writeFileSync(path.join(BUILD, 'icon.png'), png512);
}

async function main() {
  const sharp = await loadSharp();
  const source = resolveSource();

  fs.mkdirSync(BUILD, { recursive: true });

  await writePng512(sharp, source);
  await writeIco(sharp, source);

  console.log('Icons synced from', source, '→', BUILD);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
