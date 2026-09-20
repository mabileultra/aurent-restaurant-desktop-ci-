const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

test('activityLogStore appends txt and jsonl', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aurent-logs-'));
  const electronApp = {
    getPath: () => tmp,
  };
  // Monkey-patch via require cache after injecting fake app is hard; test pure helpers instead.
  const storePath = require.resolve('../electron/activity-log/activityLogStore.cjs');
  delete require.cache[storePath];

  // Re-require with stubbed electron
  const Module = require('module');
  const originalLoad = Module._load;
  Module._load = function mockLoad(request, parent, isMain) {
    if (request === 'electron') {
      return { app: electronApp };
    }
    return originalLoad(request, parent, isMain);
  };
  try {
    delete require.cache[storePath];
    const store = require('../electron/activity-log/activityLogStore.cjs');
    const entry = store.appendActivityLog({
      category: 'fiscal',
      level: 'info',
      message: 'Чек фискализирован',
      meta: { sign: '123' },
    });
    assert.equal(entry.category, 'fiscal');
    const files = store.listActivityLogFiles();
    assert.ok(files.some((f) => f.name.endsWith('.txt')));
    assert.ok(files.some((f) => f.name.endsWith('.jsonl')));
    const txt = files.find((f) => f.kind === 'txt');
    const read = store.readActivityLogFile(txt.path);
    assert.match(read.content, /Чек фискализирован/);
    assert.match(read.content, /fiscal/);
  } finally {
    Module._load = originalLoad;
    delete require.cache[storePath];
  }
});
