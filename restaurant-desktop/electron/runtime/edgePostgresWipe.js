/**
 * Wipe embedded Postgres data dir (company switch / factory tenant reset).
 * Kept separate from edgePostgres.js boot path.
 */
const fs = require('fs');
const {
  dataDir,
  resolvePgsqlBinDir,
  forceStopCluster,
  stopEdgePostgres,
  markPostgresStopped,
} = require('./edgePostgres');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function wipeEdgeDataDir({ log = console.log } = {}) {
  const binDir = resolvePgsqlBinDir();
  const dir = dataDir();
  log(`[edge-db] wiping tenant data: ${dir}`);
  if (binDir && fs.existsSync(dir)) {
    await forceStopCluster(binDir, dir, log);
  }
  await stopEdgePostgres({ log }).catch(() => {});
  markPostgresStopped();

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
      if (!fs.existsSync(dir)) {
        log('[edge-db] pgdata removed');
        return { wiped: true, dataDir: dir };
      }
    } catch (err) {
      log(`[edge-db] wipe attempt ${attempt}: ${err.message || err}`);
    }
    await sleep(400 * attempt);
  }
  throw new Error(
    'Не удалось удалить локальную БД (файлы заняты). Закройте Aurent Restaurant и повторите.'
  );
}

module.exports = { wipeEdgeDataDir };
