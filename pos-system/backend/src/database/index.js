const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

let db;

function getDb() {
  if (!db) {
    const dbPath = path.resolve(config.database.path);
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initSchema() {
  const db = getDb();

  db.exec(`
    -- ─── Categories ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS categories (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      description TEXT,
      color       TEXT DEFAULT '#6366f1',
      icon        TEXT DEFAULT 'tag',
      sort_order  INTEGER DEFAULT 0,
      active      INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    -- ─── Products ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS products (
      id              TEXT PRIMARY KEY,
      sku             TEXT NOT NULL UNIQUE,
      barcode         TEXT UNIQUE,
      name            TEXT NOT NULL,
      description     TEXT,
      category_id     TEXT REFERENCES categories(id),
      price           REAL NOT NULL,
      cost            REAL DEFAULT 0,
      tax_rate        REAL,
      track_inventory INTEGER DEFAULT 1,
      stock_qty       REAL DEFAULT 0,
      low_stock_alert REAL DEFAULT 5,
      unit            TEXT DEFAULT 'ea',
      image_url       TEXT,
      active          INTEGER DEFAULT 1,
      modifiers       TEXT DEFAULT '[]',
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_sku      ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_barcode  ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

    -- ─── Customers ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS customers (
      id           TEXT PRIMARY KEY,
      first_name   TEXT NOT NULL,
      last_name    TEXT NOT NULL,
      email        TEXT UNIQUE,
      phone        TEXT,
      address      TEXT,
      city         TEXT,
      state        TEXT,
      zip          TEXT,
      loyalty_pts  INTEGER DEFAULT 0,
      notes        TEXT,
      active       INTEGER DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

    -- ─── Employees ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS employees (
      id           TEXT PRIMARY KEY,
      first_name   TEXT NOT NULL,
      last_name    TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      pin          TEXT NOT NULL,
      password     TEXT,
      role         TEXT NOT NULL DEFAULT 'cashier',
      permissions  TEXT DEFAULT '[]',
      active       INTEGER DEFAULT 1,
      created_at   TEXT DEFAULT (datetime('now')),
      updated_at   TEXT DEFAULT (datetime('now'))
    );

    -- ─── Orders ───────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS orders (
      id              TEXT PRIMARY KEY,
      order_number    TEXT NOT NULL UNIQUE,
      status          TEXT NOT NULL DEFAULT 'open',
      customer_id     TEXT REFERENCES customers(id),
      employee_id     TEXT REFERENCES employees(id),
      register_id     TEXT,
      subtotal        REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      tax_amount      REAL NOT NULL DEFAULT 0,
      tip_amount      REAL NOT NULL DEFAULT 0,
      total           REAL NOT NULL DEFAULT 0,
      amount_paid     REAL NOT NULL DEFAULT 0,
      change_due      REAL NOT NULL DEFAULT 0,
      notes           TEXT,
      metadata        TEXT DEFAULT '{}',
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      completed_at    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_number   ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_employee ON orders(employee_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(created_at);

    -- ─── Order Items ──────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS order_items (
      id           TEXT PRIMARY KEY,
      order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id   TEXT REFERENCES products(id),
      name         TEXT NOT NULL,
      sku          TEXT,
      quantity     REAL NOT NULL,
      unit_price   REAL NOT NULL,
      discount_pct REAL DEFAULT 0,
      tax_rate     REAL DEFAULT 0,
      line_total   REAL NOT NULL,
      modifiers    TEXT DEFAULT '[]',
      notes        TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    -- ─── Payments ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS payments (
      id             TEXT PRIMARY KEY,
      order_id       TEXT NOT NULL REFERENCES orders(id),
      method         TEXT NOT NULL,
      amount         REAL NOT NULL,
      reference      TEXT,
      card_last4     TEXT,
      card_brand     TEXT,
      status         TEXT DEFAULT 'approved',
      gateway_data   TEXT DEFAULT '{}',
      created_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

    -- ─── Inventory Adjustments ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id          TEXT PRIMARY KEY,
      product_id  TEXT NOT NULL REFERENCES products(id),
      qty_before  REAL NOT NULL,
      qty_change  REAL NOT NULL,
      qty_after   REAL NOT NULL,
      reason      TEXT NOT NULL,
      reference   TEXT,
      employee_id TEXT REFERENCES employees(id),
      notes       TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ─── Discounts ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS discounts (
      id          TEXT PRIMARY KEY,
      code        TEXT UNIQUE,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      value       REAL NOT NULL,
      min_order   REAL DEFAULT 0,
      max_uses    INTEGER,
      uses_count  INTEGER DEFAULT 0,
      active      INTEGER DEFAULT 1,
      starts_at   TEXT,
      expires_at  TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    -- ─── Registers ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS registers (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      location        TEXT,
      status          TEXT DEFAULT 'closed',
      opening_cash    REAL DEFAULT 0,
      current_cash    REAL DEFAULT 0,
      opened_by       TEXT REFERENCES employees(id),
      opened_at       TEXT,
      closed_at       TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('[DB] Schema initialized');
  return db;
}

module.exports = { getDb, initSchema };
