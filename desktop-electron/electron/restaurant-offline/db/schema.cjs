/**
 * B1 — restaurant local-first SQLite schema.
 * Status enums come from domain/ (B0). Ids are client TEXT (UUID); server_* nullable for sync.
 */

const SCHEMA_VERSION = 1;

const REQUIRED_TABLES = Object.freeze([
  'meta',
  'devices',
  'menu_categories',
  'menu_items',
  'floor_tables',
  'printers',
  'orders',
  'order_items',
  'print_jobs',
  'outbox',
  'sync_state',
]);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY NOT NULL,
  server_id INTEGER,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  auto_print INTEGER NOT NULL DEFAULT 0,
  print_printer_name TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rst_menu_categories_store
  ON menu_categories(store_id, active, sort_order);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY NOT NULL,
  server_id INTEGER,
  store_id INTEGER NOT NULL,
  category_id TEXT,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id)
);
CREATE INDEX IF NOT EXISTS idx_rst_menu_items_store
  ON menu_items(store_id, active, category_id);

CREATE TABLE IF NOT EXISTS floor_tables (
  id TEXT PRIMARY KEY NOT NULL,
  server_id INTEGER,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  zone_name TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rst_floor_tables_store
  ON floor_tables(store_id, active, sort_order);

CREATE TABLE IF NOT EXISTS printers (
  id TEXT PRIMARY KEY NOT NULL,
  store_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rst_printers_store_name
  ON printers(store_id, name);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  store_id INTEGER NOT NULL,
  table_id TEXT,
  status TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  waiter_id TEXT,
  waiter_name TEXT,
  opened_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  closed_at TEXT,
  payload_json TEXT,
  FOREIGN KEY (table_id) REFERENCES floor_tables(id)
);
CREATE INDEX IF NOT EXISTS idx_rst_orders_store_status
  ON orders(store_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_rst_orders_table
  ON orders(table_id, status);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY NOT NULL,
  server_id TEXT,
  order_id TEXT NOT NULL,
  menu_item_id TEXT,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN',
  portion_text TEXT,
  note TEXT,
  modifiers_json TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
CREATE INDEX IF NOT EXISTS idx_rst_order_items_order
  ON order_items(order_id, status);

CREATE TABLE IF NOT EXISTS print_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT,
  kind TEXT NOT NULL,
  printer_name TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  started_at TEXT,
  printed_at TEXT,
  last_error TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE INDEX IF NOT EXISTS idx_rst_print_jobs_status
  ON print_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_rst_print_jobs_printer
  ON print_jobs(printer_name, status, created_at);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  device_id TEXT NOT NULL,
  client_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  sent_at TEXT,
  synced_at TEXT,
  next_retry_at TEXT,
  last_error TEXT,
  UNIQUE (device_id, client_event_id)
);
CREATE INDEX IF NOT EXISTS idx_rst_outbox_claim
  ON outbox(status, next_retry_at, created_at);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

module.exports = {
  SCHEMA_VERSION,
  SCHEMA,
  REQUIRED_TABLES,
};
