/**
 * Download a portable Temurin JRE into resources/jre-{mac|win}-{arm64|x64}
 * so clean PCs do not need a system Java install.
 *
 * Usage:
 *   node scripts/fetch-jre.js              # host platform/arch
 *   node scripts/fetch-jre.js mac arm64
 *   node scripts/fetch-jre.js win x64
 *   node scripts/fetch-jre.js --all-release  # mac arm64+x64 + win x64 (CI)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RESOURCES = path.join(ROOT, 'resources');
const JAVA_MAJOR = '17';

function mapOs(os) {
  if (os === 'mac' || os === 'darwin') return { adopt: 'mac', folder: 'mac' };
  if (os === 'win' || os === 'win32' || os === 'windows') return { adopt: 'windows', folder: 'win' };
  if (os === 'linux') return { adopt: 'linux', folder: 'linux' };
  throw new Error(`Unsupported OS: ${os}`);
}

function mapArch(arch) {
  if (arch === 'arm64' || arch === 'aarch64') return 'aarch64';
  if (arch === 'x64' || arch === 'amd64' || arch === 'x86_64') return 'x64';
  throw new Error(`Unsupported arch: ${arch}`);
}

function folderArch(arch) {
  return arch === 'aarch64' || arch === 'arm64' ? 'arm64' : 'x64';
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const go = (u, redirects = 0) => {
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects > 8) {
            reject(new Error('too many redirects'));
            return;
          }
          go(res.headers.location, redirects + 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
      }).on('error', reject);
    };
    go(url);
  });
}

function adoptiumUrl(os, arch) {
  const { adopt } = mapOs(os);
  const a = mapArch(arch);
  return `https://api.adoptium.net/v3/binary/latest/${JAVA_MAJOR}/ga/${adopt}/${a}/jre/hotspot/normal/eclipse?project=jdk`;
}

function extractArchive(archive, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  if (archive.endsWith('.zip')) {
    execFileSync('unzip', ['-q', '-o', archive, '-d', destDir], { stdio: 'inherit' });
  } else {
    execFileSync('tar', ['-xzf', archive, '-C', destDir], { stdio: 'inherit' });
  }
}

function findJavaHome(root) {
  const javaRel = process.platform === 'win32' ? path.join('bin', 'java.exe') : path.join('bin', 'java');
  if (fs.existsSync(path.join(root, javaRel))) return root;
  // macOS Adoptium often ships as …/Contents/Home
  const macHome = path.join(root, 'Contents', 'Home');
  if (fs.existsSync(path.join(macHome, 'bin', 'java'))) return macHome;
  const entries = fs.readdirSync(root).filter((n) => !n.startsWith('.'));
  for (const name of entries) {
    const child = path.join(root, name);
    if (!fs.statSync(child).isDirectory()) continue;
    const found = findJavaHome(child);
    if (found) return found;
  }
  return null;
}

function flattenJreHome(extractRoot, finalDir) {
  const jreHome = findJavaHome(extractRoot);
  if (!jreHome) {
    throw new Error(`No Java home under ${extractRoot}`);
  }
  if (fs.existsSync(finalDir)) fs.rmSync(finalDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(finalDir), { recursive: true });
  fs.cpSync(jreHome, finalDir, { recursive: true });
  fs.rmSync(extractRoot, { recursive: true, force: true });
}

async function fetchOne(os, arch) {
  const { folder } = mapOs(os);
  const fa = folderArch(arch);
  const finalDir = path.join(RESOURCES, `jre-${folder}-${fa}`);
  const javaName = folder === 'win' ? 'java.exe' : 'java';
  if (fs.existsSync(path.join(finalDir, 'bin', javaName))) {
    console.log(`[jre] already present: ${finalDir}`);
    return finalDir;
  }

  fs.mkdirSync(RESOURCES, { recursive: true });
  const url = adoptiumUrl(os, arch);
  const ext = folder === 'win' ? 'zip' : 'tar.gz';
  const archive = path.join(RESOURCES, `jre-download-${folder}-${fa}.${ext}`);
  const staging = path.join(RESOURCES, `jre-staging-${folder}-${fa}`);

  console.log(`[jre] downloading ${folder}/${fa} …`);
  await download(url, archive);
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  extractArchive(archive, staging);
  flattenJreHome(staging, finalDir);
  fs.rmSync(archive, { force: true });
  if (!fs.existsSync(path.join(finalDir, 'bin', javaName))) {
    throw new Error(`JRE extract failed — no bin/${javaName} in ${finalDir}`);
  }
  console.log(`[jre] ready → ${finalDir}`);
  return finalDir;
}

function parseTarget(token) {
  const t = String(token || '').trim();
  if (t === 'mac-arm64') return ['mac', 'arm64'];
  if (t === 'mac-x64') return ['mac', 'x64'];
  if (t === 'win-x64') return ['win', 'x64'];
  throw new Error(`Unknown JRE target: ${t}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--all-release') {
    await Promise.all([
      fetchOne('mac', 'arm64'),
      fetchOne('mac', 'x64'),
      fetchOne('win', 'x64'),
    ]);
    return;
  }
  if (args[0] === '--targets' && args[1]) {
    const list = args[1].split(',').map((s) => s.trim()).filter(Boolean);
    await Promise.all(list.map((t) => {
      const [os, arch] = parseTarget(t);
      return fetchOne(os, arch);
    }));
    return;
  }
  const os = args[0] || process.platform;
  const arch = args[1] || process.arch;
  await fetchOne(os, arch);
}

main().catch((err) => {
  console.error('[jre]', err.message || err);
  process.exit(1);
});
