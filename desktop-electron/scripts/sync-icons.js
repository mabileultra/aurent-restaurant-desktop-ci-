#!/usr/bin/env node
/**
 * Иконки Electron: logo1.png (Aurent) или fallback icon.svg
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOGO1 = path.join(ROOT, '..', 'web-frontend', 'public', 'brand', 'logo1.png');
const SVG = path.join(ROOT, '..', 'web-frontend', 'public', 'desktop', 'icon.svg');
const BUILD = path.join(ROOT, 'build');

async function main() {
  fs.mkdirSync(BUILD, { recursive: true });

  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.warn('sharp not installed — run npm install in desktop-electron');
    if (fs.existsSync(SVG)) fs.copyFileSync(SVG, path.join(BUILD, 'icon.svg'));
    process.exit(0);
  }

  const source = fs.existsSync(LOGO1) ? LOGO1 : SVG;
  if (!fs.existsSync(source)) {
    console.error('Missing logo source:', LOGO1, 'or', SVG);
    process.exit(1);
  }

  const png512 = await sharp(source).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  fs.writeFileSync(path.join(BUILD, 'icon.png'), png512);

  try {
    const pngToIco = require('png-to-ico');
    const ico = await pngToIco([png512]);
    fs.writeFileSync(path.join(BUILD, 'icon.ico'), ico);
  } catch (e) {
    console.warn('icon.ico skip:', e.message);
  }

  if (process.platform === 'darwin') {
    const { execSync } = require('child_process');
    const icnsPath = path.join(BUILD, 'icon.icns');
    const iconset = path.join(BUILD, 'icon.iconset');
    fs.mkdirSync(iconset, { recursive: true });
    const sizes = [16, 32, 64, 128, 256, 512];
    for (const size of sizes) {
      const buf = await sharp(source).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      fs.writeFileSync(path.join(iconset, `icon_${size}x${size}.png`), buf);
      if (size <= 512) {
        fs.writeFileSync(path.join(iconset, `icon_${size}x${size}@2x.png`), buf);
      }
    }
    execSync(`iconutil -c icns "${iconset}" -o "${icnsPath}"`, { stdio: 'inherit' });
  }

  console.log('Icons synced from', source, 'to', BUILD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
