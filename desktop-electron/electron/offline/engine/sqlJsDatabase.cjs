const fs = require('fs');
const path = require('path');

function resolveSqlWasmFile(file, { resourcesPath, appPath, cwd } = {}) {
  const fileName = path.basename(file || 'sql-wasm.wasm');
  const candidates = [];
  const push = (p) => {
    if (p) candidates.push(p);
  };

  if (resourcesPath) {
    push(path.join(resourcesPath, 'sql.js', fileName));
    push(path.join(resourcesPath, fileName));
    push(path.join(resourcesPath, 'app.asar.unpacked', 'node_modules', 'sql.js', 'dist', fileName));
  }
  push(path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist', fileName));
  if (appPath) {
    push(path.join(appPath, 'node_modules', 'sql.js', 'dist', fileName));
  }
  push(path.join(cwd || process.cwd(), 'node_modules', 'sql.js', 'dist', fileName));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`sql.js wasm not found: ${fileName}`);
}

async function openSqlJsDatabase(filePath, locateFile) {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs({ locateFile });
  if (fs.existsSync(filePath)) {
    return new SQL.Database(fs.readFileSync(filePath));
  }
  return new SQL.Database();
}

function persistSqlJsDatabase(db, filePath) {
  if (!db) return;
  const data = db.export();
  const tmpPath = `${filePath}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tmpPath, Buffer.from(data));
  fs.renameSync(tmpPath, filePath);
}

module.exports = {
  resolveSqlWasmFile,
  openSqlJsDatabase,
  persistSqlJsDatabase,
};
