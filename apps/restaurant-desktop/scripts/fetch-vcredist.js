/** Download VC++ Redistributable x64 into resources/ for NSIS customInstall. */
const fs = require('fs');
const path = require('path');
const https = require('https');

const URL = 'https://aka.ms/vs/17/release/vc_redist.x64.exe';
const dest = path.join(__dirname, '..', 'resources', 'vc_redist.x64.exe');

function follow(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'aurent-restaurant-desktop' } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirects > 8) return reject(new Error('too many redirects'));
        res.resume();
        return resolve(follow(res.headers.location, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      resolve(res);
    }).on('error', reject);
  });
}

(async () => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1_000_000) {
    console.log(`[vcredist] already present ${dest}`);
    return;
  }
  console.log(`[vcredist] downloading ${URL} …`);
  const res = await follow(URL);
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    res.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
  });
  console.log(`[vcredist] saved ${dest} (${fs.statSync(dest).size} bytes)`);
})().catch((err) => {
  console.error(`[vcredist] ${err.message || err}`);
  process.exit(1);
});
