// Database schema definitions for Slimbooks
// Contains all table creation statements and schema management

/**
 * Create all database tables
 * @param {Database} db - SQLite database instance
 */
export const createTables = (db) => {
  console.log('Creating database tables...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      email_verified INTEGER DEFAULT 0,
      google_id TEXT UNIQUE,
      two_factor_enabled INTEGER DEFAULT 0,
      two_factor_secret TEXT,
      backup_codes TEXT,
      last_login TEXT,
      failed_login_attempts INTEGER DEFAULT 0,
      account_locked_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zipCode TEXT,
      country TEXT,
      stripe_customer_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      template_id INTEGER,
      amount REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      due_date TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      description TEXT,
      items TEXT,
      notes TEXT,
      payment_terms TEXT,
      stripe_invoice_id TEXT,
      stripe_payment_intent_id TEXT,
      type TEXT DEFAULT 'one-time',
      client_name TEXT,
      client_email TEXT,
      client_phone TEXT,
      client_address TEXT,
      line_items TEXT,
      tax_rate_id TEXT,
      shipping_amount REAL DEFAULT 0,
      shipping_rate_id TEXT,
      email_status TEXT DEFAULT 'not_sent',
      email_sent_at TEXT,
      email_error TEXT,
      last_email_attempt TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL,
      payment_terms TEXT NOT NULL,
      next_invoice_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      line_items TEXT,
      tax_amount REAL DEFAULT 0,
      tax_rate_id TEXT,
      shipping_amount REAL DEFAULT 0,
      shipping_rate_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      merchant TEXT NOT NULL DEFAULT 'Unknown Merchant',
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      receipt_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      date_range_start TEXT NOT NULL DEFAULT '',
      date_range_end TEXT NOT NULL DEFAULT '',
      data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Counters table
  db.exec(`
    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general'
    )
  `);

  // Project settings table (for .env overrides)
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      enabled INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables created successfully');
};
