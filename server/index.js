// Express server for Slimbooks SQLite backend
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  createGeneralRateLimit,
  createLoginRateLimit,
  createSecurityHeaders,
  createCorsOptions,
  validateRequest,
  validationRules,
  requestLogger,
  errorHandler
} from './security-middleware.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

// Security middleware
app.use(createSecurityHeaders(CORS_ORIGIN));
app.use(cors(createCorsOptions(CORS_ORIGIN)));
app.use(createGeneralRateLimit());
app.use(requestLogger);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb for security
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Multer configuration for file uploads with security
const upload = multer({
  dest: process.env.UPLOAD_PATH || 'uploads/',
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only allow 1 file at a time
    fieldSize: 1024 * 1024 // 1MB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific file types for security
    const allowedMimes = [
      'application/octet-stream', // For database files
      'application/x-sqlite3',
      'application/vnd.sqlite3'
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only database files are allowed.'), false);
    }
  }
});

// Database setup
const dataDir = join(__dirname, '..', 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'slimbooks.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log('SQLite database initialized at:', dbPath);

// Database schema
const createTables = () => {
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
      description TEXT,
      items TEXT,
      notes TEXT,
      payment_terms TEXT,
      hourly_rate REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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

  console.log('Database tables created successfully');
};

// Migration function to add missing columns to existing databases
const runMigrations = () => {
  console.log('Running database migrations...');

  try {
    // Check if invoices table has the new columns
    const tableInfo = db.prepare("PRAGMA table_info(invoices)").all();
    const existingColumns = tableInfo.map(col => col.name);

    const requiredColumns = [
      { name: 'template_id', type: 'INTEGER' },
      { name: 'type', type: 'TEXT DEFAULT "one-time"' },
      { name: 'client_name', type: 'TEXT' },
      { name: 'client_email', type: 'TEXT' },
      { name: 'client_phone', type: 'TEXT' },
      { name: 'client_address', type: 'TEXT' },
      { name: 'line_items', type: 'TEXT' },
      { name: 'tax_rate_id', type: 'TEXT' },
      { name: 'shipping_amount', type: 'REAL DEFAULT 0' },
      { name: 'shipping_rate_id', type: 'TEXT' },
      { name: 'email_error', type: 'TEXT' },
      { name: 'last_email_attempt', type: 'TEXT' }
    ];

    // Add missing columns
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          db.exec(`ALTER TABLE invoices ADD COLUMN ${column.name} ${column.type}`);
          console.log(`Added column: ${column.name}`);
        } catch (error) {
          console.log(`Column ${column.name} might already exist or error:`, error.message);
        }
      }
    }

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Initialize database
createTables();
runMigrations();

// Initialize counters if empty
const initializeCounters = () => {
  const counterCheck = db.prepare('SELECT COUNT(*) as count FROM counters').get();
  if (counterCheck.count === 0) {
    const counters = [
      { name: 'clients', value: 0 },
      { name: 'invoices', value: 0 },
      { name: 'templates', value: 0 },
      { name: 'expenses', value: 0 },
      { name: 'reports', value: 0 }
    ];
    
    const stmt = db.prepare('INSERT INTO counters (name, value) VALUES (?, ?)');
    counters.forEach(counter => {
      stmt.run(counter.name, counter.value);
    });
    console.log('Counters initialized');
  }
};

initializeCounters();

// Initialize admin user
const initializeAdminUser = async () => {
  try {
    const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@slimbooks.app');
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('r1u2s3s4e5', 12);
      const stmt = db.prepare(`
        INSERT INTO users (name, email, username, password_hash, role, email_verified)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        'Administrator',
        'admin@slimbooks.app',
        'admin@slimbooks.app',
        hashedPassword,
        'admin',
        1
      );
      
      console.log('✅ Admin user created: admin@slimbooks.app / r1u2s3s4e5');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};

initializeAdminUser();

// Initialize sample data for development
const initializeSampleData = () => {
  try {
    // Check if we already have sample data
    const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();

    console.log(`📊 Current database state: ${clientCount.count} clients`);

    if (clientCount.count === 0) {
      console.log('🌱 Adding sample data for development...');

      // Sample clients
      const clientStmt = db.prepare(`
        INSERT INTO clients (id, name, email, phone, company, address, city, state, zipCode, country, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const sampleClients = [
        [1, 'John Smith', 'john@techcorp.com', '(555) 123-4567', 'TechCorp Inc', '123 Business Ave', 'San Francisco', 'CA', '94105', 'USA', '2024-11-15T10:00:00Z'],
        [2, 'Sarah Johnson', 'sarah@designstudio.com', '(555) 234-5678', 'Design Studio LLC', '456 Creative St', 'New York', 'NY', '10001', 'USA', '2024-12-01T14:30:00Z'],
        [3, 'Mike Chen', 'mike@startupxyz.com', '(555) 345-6789', 'StartupXYZ', '789 Innovation Blvd', 'Austin', 'TX', '73301', 'USA', '2024-11-20T09:15:00Z'],
        [4, 'Emily Davis', 'emily@consultingfirm.com', '(555) 456-7890', 'Davis Consulting', '321 Professional Dr', 'Seattle', 'WA', '98101', 'USA', '2024-12-05T16:45:00Z']
      ];

      sampleClients.forEach(client => clientStmt.run(...client));

      // Sample invoices
      const invoiceStmt = db.prepare(`
        INSERT INTO invoices (id, invoice_number, client_id, amount, tax_amount, total_amount, status, due_date, issue_date, description, items, line_items, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const sampleInvoices = [
        [1, 'INV-2024-001', 1, 5000.00, 500.00, 5500.00, 'paid', '2024-12-15', '2024-11-15', 'Website Development', '[{"description":"Website Development","quantity":1,"rate":5000,"amount":5000}]', '[{"id":"1","description":"Website Development","quantity":1,"rate":5000,"amount":5000}]', 'one-time', '2024-11-15T10:00:00Z'],
        [2, 'INV-2024-002', 2, 3000.00, 300.00, 3300.00, 'paid', '2024-12-20', '2024-12-01', 'Logo Design Package', '[{"description":"Logo Design Package","quantity":1,"rate":3000,"amount":3000}]', '[{"id":"1","description":"Logo Design Package","quantity":1,"rate":3000,"amount":3000}]', 'one-time', '2024-12-01T14:30:00Z'],
        [3, 'INV-2024-003', 1, 2500.00, 250.00, 2750.00, 'sent', '2024-12-25', '2024-12-05', 'Mobile App Consultation', '[{"description":"Mobile App Consultation","quantity":10,"rate":250,"amount":2500}]', '[{"id":"1","description":"Mobile App Consultation","quantity":10,"rate":250,"amount":2500}]', 'one-time', '2024-12-05T11:20:00Z'],
        [4, 'INV-2024-004', 3, 4000.00, 400.00, 4400.00, 'sent', '2024-12-30', '2024-11-20', 'Backend API Development', '[{"description":"Backend API Development","quantity":1,"rate":4000,"amount":4000}]', '[{"id":"1","description":"Backend API Development","quantity":1,"rate":4000,"amount":4000}]', 'one-time', '2024-11-20T13:10:00Z'],
        [5, 'INV-2024-005', 4, 1500.00, 150.00, 1650.00, 'overdue', '2024-12-10', '2024-11-25', 'Business Strategy Consultation', '[{"description":"Business Strategy Consultation","quantity":6,"rate":250,"amount":1500}]', '[{"id":"1","description":"Business Strategy Consultation","quantity":6,"rate":250,"amount":1500}]', 'one-time', '2024-11-25T15:30:00Z'],
        [6, 'INV-2024-006', 2, 2000.00, 200.00, 2200.00, 'draft', '2024-12-31', '2024-12-10', 'Brand Guidelines', '[{"description":"Brand Guidelines","quantity":1,"rate":2000,"amount":2000}]', '[{"id":"1","description":"Brand Guidelines","quantity":1,"rate":2000,"amount":2000}]', 'one-time', '2024-12-10T09:45:00Z']
      ];

      sampleInvoices.forEach(invoice => invoiceStmt.run(...invoice));

      // Sample expenses
      const expenseStmt = db.prepare(`
        INSERT INTO expenses (id, merchant, amount, category, description, date, status, receipt_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const sampleExpenses = [
        [1, 'Office Depot', 250.00, 'Office Supplies', 'Printer paper and ink cartridges', '2024-01-10', 'approved', null, '2024-01-10T14:20:00Z'],
        [2, 'Starbucks', 45.50, 'Meals & Entertainment', 'Client meeting coffee', '2024-01-15', 'approved', null, '2024-01-15T16:30:00Z'],
        [3, 'Adobe', 52.99, 'Software', 'Creative Cloud subscription', '2024-02-01', 'approved', null, '2024-02-01T10:00:00Z'],
        [4, 'Uber', 28.75, 'Transportation', 'Client meeting transportation', '2024-02-10', 'approved', null, '2024-02-10T18:45:00Z'],
        [5, 'AWS', 125.00, 'Software', 'Cloud hosting services', '2024-02-15', 'approved', null, '2024-02-15T12:00:00Z'],
        [6, 'FedEx', 35.20, 'Shipping', 'Document delivery to client', '2024-03-01', 'pending', null, '2024-03-01T11:15:00Z']
      ];

      sampleExpenses.forEach(expense => expenseStmt.run(...expense));

      // Update counters
      db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(4, 'clients');
      db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(6, 'invoices');
      db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(6, 'expenses');

      console.log('✅ Sample data added successfully');
      console.log('   - 4 sample clients');
      console.log('   - 6 sample invoices (2 paid, 2 sent, 1 overdue, 1 draft)');
      console.log('   - 6 sample expenses');
    } else {
      console.log('✅ Sample data already exists');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

// Add sample invoices for existing clients
const addSampleInvoices = () => {
  try {
    const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
    console.log(`📋 Current invoices: ${invoiceCount.count}`);

    if (invoiceCount.count === 0) {
      console.log('🧾 Adding sample invoices for existing clients...');

      // Get first few clients
      const clients = db.prepare('SELECT * FROM clients ORDER BY id LIMIT 4').all();

      if (clients.length > 0) {
        const invoiceStmt = db.prepare(`
          INSERT INTO invoices (id, invoice_number, client_id, amount, tax_amount, total_amount, status, due_date, issue_date, description, items, line_items, type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const sampleInvoices = [
          [1, 'INV-2024-001', clients[0]?.id || 1, 5000.00, 500.00, 5500.00, 'paid', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`, 'Website Development', '[{"description":"Website Development","quantity":1,"rate":5000,"amount":5000}]', '[{"id":"1","description":"Website Development","quantity":1,"rate":5000,"amount":5000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01T10:00:00Z`],
          [2, 'INV-2024-002', clients[1]?.id || 2, 3000.00, 300.00, 3300.00, 'paid', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`, 'Logo Design Package', '[{"description":"Logo Design Package","quantity":1,"rate":3000,"amount":3000}]', '[{"id":"1","description":"Logo Design Package","quantity":1,"rate":3000,"amount":3000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05T14:30:00Z`],
          [3, 'INV-2024-003', clients[0]?.id || 1, 2500.00, 250.00, 2750.00, 'sent', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-25`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`, 'Mobile App Consultation', '[{"description":"Mobile App Consultation","quantity":10,"rate":250,"amount":2500}]', '[{"id":"1","description":"Mobile App Consultation","quantity":10,"rate":250,"amount":2500}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10T11:20:00Z`],
          [4, 'INV-2024-004', clients[2]?.id || 3, 4000.00, 400.00, 4400.00, 'sent', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-30`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12`, 'Backend API Development', '[{"description":"Backend API Development","quantity":1,"rate":4000,"amount":4000}]', '[{"id":"1","description":"Backend API Development","quantity":1,"rate":4000,"amount":4000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12T13:10:00Z`],
          [5, 'INV-2024-005', clients[3]?.id || 4, 1500.00, 150.00, 1650.00, 'overdue', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`, `${currentYear}-${String(currentMonth).padStart(2, '0')}-25`, 'Business Strategy Consultation', '[{"description":"Business Strategy Consultation","quantity":6,"rate":250,"amount":1500}]', '[{"id":"1","description":"Business Strategy Consultation","quantity":6,"rate":250,"amount":1500}]', 'one-time', `${currentYear}-${String(currentMonth).padStart(2, '0')}-25T15:30:00Z`],
          [6, 'INV-2024-006', clients[1]?.id || 2, 2000.00, 200.00, 2200.00, 'draft', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`, 'Brand Guidelines', '[{"description":"Brand Guidelines","quantity":1,"rate":2000,"amount":2000}]', '[{"id":"1","description":"Brand Guidelines","quantity":1,"rate":2000,"amount":2000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15T09:45:00Z`]
        ];

        sampleInvoices.forEach(invoice => {
          try {
            invoiceStmt.run(...invoice);
          } catch (err) {
            console.log('Invoice insert error (might already exist):', err.message);
          }
        });

        // Update invoice counter
        try {
          db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(6, 'invoices');
        } catch (err) {
          console.log('Counter update error:', err.message);
        }

        console.log('✅ Sample invoices added for current month');
      }
    } else {
      console.log('✅ Invoices already exist');
    }
  } catch (error) {
    console.error('Error adding sample invoices:', error);
  }
};

// Only add sample data in development
if (process.env.NODE_ENV !== 'production') {
  initializeSampleData();
  addSampleInvoices();
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Debug endpoint to check data - ONLY in development
if (process.env.ENABLE_DEBUG_ENDPOINTS === 'true' && NODE_ENV === 'development') {
  app.get('/api/debug/data', (req, res) => {
    try {
      const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC LIMIT 5').all();
      const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC LIMIT 5').all();
      const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 5').all();

      res.json({
        success: true,
        data: {
          clients: {
            count: db.prepare('SELECT COUNT(*) as count FROM clients').get().count,
            sample: clients
          },
          invoices: {
            count: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
            sample: invoices
          },
          expenses: {
            count: db.prepare('SELECT COUNT(*) as count FROM expenses').get().count,
            sample: expenses
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Generic database operations - RESTRICTED AND SECURED
// These endpoints are dangerous and should only be used for specific operations

// Secure database read operations - only allow SELECT statements
app.post('/api/db/get',
  validationRules.sql,
  validateRequest,
  (req, res) => {
    try {
      const { sql, params = [] } = req.body;

      // Only allow SELECT statements
      if (!sql.trim().toUpperCase().startsWith('SELECT')) {
        return res.status(400).json({
          success: false,
          error: 'Only SELECT statements are allowed'
        });
      }

      const stmt = db.prepare(sql);
      const result = stmt.get(params);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

app.post('/api/db/all',
  validationRules.sql,
  validateRequest,
  (req, res) => {
    try {
      const { sql, params = [] } = req.body;

      // Only allow SELECT statements
      if (!sql.trim().toUpperCase().startsWith('SELECT')) {
        return res.status(400).json({
          success: false,
          error: 'Only SELECT statements are allowed'
        });
      }

      const stmt = db.prepare(sql);
      const result = stmt.all(params);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// REMOVED: /api/db/run endpoint - too dangerous for production

// Counter operations
app.get('/api/counters/:name/next', (req, res) => {
  try {
    const { name } = req.params;
    const result = db.prepare('SELECT value FROM counters WHERE name = ?').get(name);
    const currentValue = result?.value || 0;
    const nextValue = currentValue + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextValue, name);
    res.json({ success: true, nextId: nextValue });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Settings operations
app.get('/api/settings/:key', (req, res) => {
  try {
    const { key } = req.params;
    const result = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    if (result?.value) {
      try {
        const parsedValue = JSON.parse(result.value);
        res.json({ success: true, value: parsedValue });
      } catch {
        res.json({ success: true, value: result.value });
      }
    } else {
      res.json({ success: true, value: null });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { key, value, category = 'general' } = req.body;
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    db.prepare('INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)').run(key, jsonValue, category);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database export endpoint
app.get('/api/db/export', async (req, res) => {
  try {
    const { readFileSync } = await import('fs');

    // Read the database file
    const dbBuffer = readFileSync(dbPath);

    // Set headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="slimbooks-backup-${timestamp}.db"`);
    res.setHeader('Content-Length', dbBuffer.length);

    // Send the database file
    res.send(dbBuffer);
  } catch (error) {
    console.error('Database export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database import endpoint
app.post('/api/db/import', upload.single('database'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No database file provided' });
    }

    const { existsSync, copyFileSync, unlinkSync } = await import('fs');

    // Close current database connection
    db.close();

    // Backup current database
    const backupPath = dbPath + '.backup.' + Date.now();
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, backupPath);
    }

    try {
      // Replace database file with uploaded file
      copyFileSync(req.file.path, dbPath);

      // Clean up uploaded file
      unlinkSync(req.file.path);

      // Reinitialize database connection
      const Database = (await import('better-sqlite3')).default;
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');

      res.json({ success: true, message: 'Database imported successfully' });
    } catch (importError) {
      // Restore backup if import failed
      if (existsSync(backupPath)) {
        copyFileSync(backupPath, dbPath);
      }
      throw importError;
    } finally {
      // Clean up backup file
      if (existsSync(backupPath)) {
        unlinkSync(backupPath);
      }
    }
  } catch (error) {
    console.error('Database import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add login rate limiting for authentication endpoints
const loginRateLimit = createLoginRateLimit(
  parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5 // 5 attempts
);

// Apply login rate limiting to auth endpoints (when they exist)
// app.post('/api/auth/login', loginRateLimit, ...);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Slimbooks backend server running on http://localhost:${PORT}`);
  console.log(`📁 Database location: ${dbPath}`);
  console.log(`🔒 Security: CORS origin set to ${CORS_ORIGIN}`);
  console.log(`🛡️  Security headers enabled`);
  console.log(`⚡ Rate limiting enabled`);
  if (NODE_ENV === 'development' && process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
    console.log(`🐛 Debug endpoints enabled (development only)`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close();
  process.exit(0);
});
