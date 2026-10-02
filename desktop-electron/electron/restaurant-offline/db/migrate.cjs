const { SCHEMA, SCHEMA_VERSION, REQUIRED_TABLES } = require('./schema.cjs');

/**
 * Apply restaurant offline schema. Accepts better-sqlite3 Database (has .exec).
 * @param {{ exec: (sql: string) => unknown }} db
 */
function applyRestaurantOfflineSchema(db) {
  if (!db || typeof db.exec !== 'function') {
    throw new Error('restaurant_offline_db_required');
  }
  db.exec(SCHEMA);
  db.exec(
    `INSERT INTO meta(key, value) VALUES('schema_version', '${SCHEMA_VERSION}')
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
  );
  return { schemaVersion: SCHEMA_VERSION };
}

/**
 * @param {{ prepare: (sql: string) => { all: (...args: unknown[]) => unknown[] } }} db
 * @returns {string[]}
 */
function listRestaurantOfflineTables(db) {
  const rows = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  ).all();
  return rows.map((r) => String(r.name));
}

/**
 * @param {{ prepare: Function }} db
 */
function assertRestaurantOfflineSchema(db) {
  const names = new Set(listRestaurantOfflineTables(db));
  const missing = REQUIRED_TABLES.filter((t) => !names.has(t));
  if (missing.length) {
    throw new Error(`restaurant_offline_schema_missing:${missing.join(',')}`);
  }
  const row = db.prepare(`SELECT value FROM meta WHERE key = ?`).get('schema_version');
  const version = Number(row?.value);
  if (version !== SCHEMA_VERSION) {
    throw new Error(`restaurant_offline_schema_version:${row?.value}`);
  }
  return { tables: [...names], schemaVersion: version };
}

module.exports = {
  applyRestaurantOfflineSchema,
  listRestaurantOfflineTables,
  assertRestaurantOfflineSchema,
};
