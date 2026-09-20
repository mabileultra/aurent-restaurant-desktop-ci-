const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const CATEGORIES = new Set([
  'system',
  'connectivity',
  'catalog',
  'fiscal',
  'sale',
  'sync',
  'print',
  'auth',
  'shift',
  'api',
  'error',
]);

function logsRootDir() {
  return path.join(app.getPath('userData'), 'activity-logs');
}

function ensureLogsDir() {
  const dir = logsRootDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function dayStamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function txtPathForDay(day = dayStamp()) {
  return path.join(ensureLogsDir(), `aurent-${day}.txt`);
}

function jsonlPathForDay(day = dayStamp()) {
  return path.join(ensureLogsDir(), `aurent-${day}.jsonl`);
}

function normalizeEntry(raw = {}) {
  const category = CATEGORIES.has(raw.category) ? raw.category : 'system';
  const level = ['info', 'warn', 'error', 'debug'].includes(raw.level) ? raw.level : 'info';
  const message = String(raw.message || '').trim() || '(empty)';
  const at = raw.at || new Date().toISOString();
  let meta = null;
  if (raw.meta != null && typeof raw.meta === 'object') {
    try {
      meta = JSON.parse(JSON.stringify(raw.meta));
    } catch {
      meta = { note: String(raw.meta) };
    }
  }
  return { at, category, level, message, meta };
}

function formatTxtLine(entry) {
  const meta = entry.meta ? ` | ${JSON.stringify(entry.meta)}` : '';
  return `[${entry.at}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${meta}\n`;
}

function appendActivityLog(raw) {
  const entry = normalizeEntry(raw);
  ensureLogsDir();
  fs.appendFileSync(txtPathForDay(), formatTxtLine(entry), 'utf8');
  fs.appendFileSync(jsonlPathForDay(), `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

function listActivityLogFiles() {
  const dir = ensureLogsDir();
  const names = fs.readdirSync(dir).filter((n) => n.endsWith('.txt') || n.endsWith('.jsonl'));
  return names
    .map((name) => {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      return {
        name,
        path: full,
        size: st.size,
        mtimeMs: st.mtimeMs,
        kind: name.endsWith('.txt') ? 'txt' : 'jsonl',
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function readActivityLogFile(filePath, { maxBytes = 1_500_000 } = {}) {
  const root = path.resolve(ensureLogsDir());
  const resolved = path.resolve(String(filePath || ''));
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error('log_path_outside_dir');
  }
  if (!fs.existsSync(resolved)) {
    throw new Error('log_not_found');
  }
  const st = fs.statSync(resolved);
  if (!st.isFile()) throw new Error('log_not_file');
  const size = st.size;
  if (size <= maxBytes) {
    return { path: resolved, content: fs.readFileSync(resolved, 'utf8'), truncated: false, size };
  }
  const fd = fs.openSync(resolved, 'r');
  try {
    const start = Math.max(0, size - maxBytes);
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    const text = buf.toString('utf8');
    const cut = text.indexOf('\n');
    const content = cut >= 0 ? text.slice(cut + 1) : text;
    return { path: resolved, content, truncated: true, size };
  } finally {
    fs.closeSync(fd);
  }
}

function todayTxtPath() {
  return txtPathForDay();
}

module.exports = {
  CATEGORIES,
  logsRootDir,
  ensureLogsDir,
  appendActivityLog,
  listActivityLogFiles,
  readActivityLogFile,
  todayTxtPath,
  dayStamp,
  normalizeEntry,
  formatTxtLine,
};
