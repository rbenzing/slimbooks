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
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL,
      payment_terms TEXT NOT NULL,
      next_invoice_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      line_items TEXT, -- JSON string
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

    // Check if templates table has the new schema
    const templateTableInfo = db.prepare("PRAGMA table_info(templates)").all();
    const templateColumns = templateTableInfo.map(col => col.name);

    // Check if we need to migrate templates table
    const needsTemplateMigration = !templateColumns.includes('client_id') ||
                                   !templateColumns.includes('frequency') ||
                                   !templateColumns.includes('line_items');

    if (needsTemplateMigration) {
      console.log('Migrating templates table to new schema...');

      try {
        // Backup existing templates
        const existingTemplates = db.prepare('SELECT * FROM templates').all();
        console.log(`Found ${existingTemplates.length} existing templates to migrate`);

        // Create backup table
        db.exec('DROP TABLE IF EXISTS templates_backup');
        db.exec('ALTER TABLE templates RENAME TO templates_backup');

        // Create new templates table with correct schema
        db.exec(`
          CREATE TABLE templates (
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

        // Try to migrate existing templates if they have compatible data
        if (existingTemplates.length > 0) {
          console.log('Attempting to migrate existing template data...');

          for (const oldTemplate of existingTemplates) {
            try {
              // Only migrate if we have the minimum required fields
              if (oldTemplate.name && oldTemplate.client_id) {
                const migratedTemplate = {
                  id: oldTemplate.id,
                  name: oldTemplate.name,
                  client_id: oldTemplate.client_id,
                  amount: oldTemplate.amount || 0,
                  description: oldTemplate.description || oldTemplate.items || '',
                  frequency: oldTemplate.frequency || 'monthly',
                  payment_terms: oldTemplate.payment_terms || 'net_30',
                  next_invoice_date: oldTemplate.next_invoice_date || new Date().toISOString().split('T')[0],
                  is_active: oldTemplate.is_active !== undefined ? oldTemplate.is_active : 1,
                  line_items: oldTemplate.line_items || null,
                  tax_amount: oldTemplate.tax_amount || 0,
                  tax_rate_id: oldTemplate.tax_rate_id || null,
                  shipping_amount: oldTemplate.shipping_amount || 0,
                  shipping_rate_id: oldTemplate.shipping_rate_id || null,
                  notes: oldTemplate.notes || '',
                  created_at: oldTemplate.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };

                const insertStmt = db.prepare(`
                  INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                                        next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                                        shipping_amount, shipping_rate_id, notes, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                insertStmt.run(
                  migratedTemplate.id,
                  migratedTemplate.name,
                  migratedTemplate.client_id,
                  migratedTemplate.amount,
                  migratedTemplate.description,
                  migratedTemplate.frequency,
                  migratedTemplate.payment_terms,
                  migratedTemplate.next_invoice_date,
                  migratedTemplate.is_active,
                  migratedTemplate.line_items,
                  migratedTemplate.tax_amount,
                  migratedTemplate.tax_rate_id,
                  migratedTemplate.shipping_amount,
                  migratedTemplate.shipping_rate_id,
                  migratedTemplate.notes,
                  migratedTemplate.created_at,
                  migratedTemplate.updated_at
                );

                console.log(`Migrated template: ${migratedTemplate.name}`);
              }
            } catch (templateError) {
              console.error(`Failed to migrate template ${oldTemplate.name}:`, templateError.message);
            }
          }
        }

        // Don't clean up backup table yet - keep it for recovery
        console.log('Templates table migration completed successfully');

      } catch (migrationError) {
        console.error('Template migration failed:', migrationError);
        // If migration fails, restore from backup if it exists
        try {
          db.exec('DROP TABLE IF EXISTS templates');
          db.exec('ALTER TABLE templates_backup RENAME TO templates');
          console.log('Restored templates from backup due to migration failure');
        } catch (restoreError) {
          console.error('Failed to restore templates backup:', restoreError);
        }
      }
    }

    // Check if templates_backup table exists and has data that main templates table doesn't
    try {
      const backupTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='templates_backup'").get();
      if (backupTableExists) {
        const backupTemplates = db.prepare('SELECT * FROM templates_backup').all();
        const mainTemplates = db.prepare('SELECT * FROM templates').all();

        console.log(`Found ${backupTemplates.length} templates in backup table and ${mainTemplates.length} in main table`);

        if (backupTemplates.length > 0 && mainTemplates.length === 0) {
          console.log('Recovering templates from backup table...');

          for (const template of backupTemplates) {
            try {
              // Map old template structure to new structure
              const migratedTemplate = {
                id: template.id,
                name: template.name || 'Untitled Template',
                client_id: template.client_id || 1, // Default to first client if missing
                amount: template.amount || 0,
                description: template.description || template.items || '',
                frequency: template.frequency || 'monthly',
                payment_terms: template.payment_terms || 'net_30',
                next_invoice_date: template.next_invoice_date || new Date().toISOString().split('T')[0],
                is_active: template.status === 'active' ? 1 : 0,
                line_items: template.items || null,
                tax_amount: template.tax_amount || 0,
                tax_rate_id: template.tax_rate_id || null,
                shipping_amount: template.shipping_amount || 0,
                shipping_rate_id: template.shipping_rate_id || null,
                notes: template.notes || null,
                created_at: template.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const insertStmt = db.prepare(`
                INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                                      next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                                      shipping_amount, shipping_rate_id, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              insertStmt.run(
                migratedTemplate.id,
                migratedTemplate.name,
                migratedTemplate.client_id,
                migratedTemplate.amount,
                migratedTemplate.description,
                migratedTemplate.frequency,
                migratedTemplate.payment_terms,
                migratedTemplate.next_invoice_date,
                migratedTemplate.is_active,
                migratedTemplate.line_items,
                migratedTemplate.tax_amount,
                migratedTemplate.tax_rate_id,
                migratedTemplate.shipping_amount,
                migratedTemplate.shipping_rate_id,
                migratedTemplate.notes,
                migratedTemplate.created_at,
                migratedTemplate.updated_at
              );

              console.log(`Successfully recovered template: ${migratedTemplate.name}`);
            } catch (templateError) {
              console.error(`Failed to recover template ${template.id}:`, templateError.message);
            }
          }

          // Now clean up backup table
          db.exec('DROP TABLE IF EXISTS templates_backup');
          console.log('Template recovery completed and backup table cleaned up');
        }
      }
    } catch (recoveryError) {
      console.error('Template recovery failed:', recoveryError.message);
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
      const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC LIMIT 5').all();

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
          },
          templates: {
            count: db.prepare('SELECT COUNT(*) as count FROM templates').get().count,
            sample: templates
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

// REMOVED: Direct SQL query endpoints - replaced with secure REST API endpoints

// ===== USER MANAGEMENT API =====
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, username, role, email_verified, two_factor_enabled, last_login, failed_login_attempts, account_locked_until, created_at, updated_at FROM users ORDER BY created_at DESC').all();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, name, email, username, role, email_verified, two_factor_enabled, last_login, failed_login_attempts, account_locked_until, created_at, updated_at FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/email/:email', (req, res) => {
  try {
    const { email } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users/update-login-attempts', (req, res) => {
  try {
    const { userId, attempts, lockedUntil } = req.body;

    if (!userId || typeof attempts !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters'
      });
    }

    const stmt = db.prepare('UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?');
    const result = stmt.run(attempts, lockedUntil || null, userId);

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users/update-last-login', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
    const result = stmt.run(now, userId);

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { userData } = req.body;

    if (!userData || !userData.email || !userData.name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user data'
      });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('users');
    const nextId = (counterResult?.value || 0) + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'users');

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, email, username, password_hash, role, email_verified,
        google_id, two_factor_enabled, two_factor_secret, backup_codes,
        last_login, failed_login_attempts, account_locked_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nextId,
      userData.name,
      userData.email,
      userData.username,
      userData.password_hash || null,
      userData.role,
      userData.email_verified ? 1 : 0,
      userData.google_id || null,
      userData.two_factor_enabled ? 1 : 0,
      userData.two_factor_secret || null,
      userData.backup_codes ? JSON.stringify(userData.backup_codes) : null,
      userData.last_login || null,
      userData.failed_login_attempts,
      userData.account_locked_until || null,
      now,
      now
    );

    res.json({ success: true, result: { lastInsertRowid: nextId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CLIENT MANAGEMENT API =====
app.get('/api/clients', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
    res.json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/clients', (req, res) => {
  try {
    const { clientData } = req.body;

    if (!clientData || !clientData.name || !clientData.email) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client data'
      });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('clients');
    const nextId = (counterResult?.value || 0) + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'clients');

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO clients (id, name, email, phone, company, address, city, state, zipCode, country, stripe_customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nextId,
      clientData.name,
      clientData.email,
      clientData.phone || '',
      clientData.company || '',
      clientData.address || '',
      clientData.city || '',
      clientData.state || '',
      clientData.zipCode || '',
      clientData.country || '',
      clientData.stripe_customer_id || null,
      now,
      now
    );

    res.json({ success: true, result: { lastInsertRowid: nextId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { clientData } = req.body;

    if (!id || !clientData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters'
      });
    }

    const fields = Object.keys(clientData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(clientData), id];

    const stmt = db.prepare(`UPDATE clients SET ${fields}, updated_at = datetime('now') WHERE id = ?`);
    const result = stmt.run(values);

    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);

    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post('/api/users/update-login-attempts', (req, res) => {
  try {
    const { userId, attempts, lockedUntil } = req.body;

    if (!userId || typeof attempts !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters'
      });
    }

    const stmt = db.prepare('UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?');
    const result = stmt.run(attempts, lockedUntil || null, userId);

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users/update-last-login', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
    const result = stmt.run(now, userId);

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users/create', (req, res) => {
  try {
    const { userData } = req.body;

    if (!userData || !userData.email || !userData.name) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user data'
      });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('users');
    const nextId = (counterResult?.value || 0) + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextId, 'users');

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, email, username, password_hash, role, email_verified,
        google_id, two_factor_enabled, two_factor_secret, backup_codes,
        last_login, failed_login_attempts, account_locked_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nextId,
      userData.name,
      userData.email,
      userData.username,
      userData.password_hash || null,
      userData.role,
      userData.email_verified ? 1 : 0,
      userData.google_id || null,
      userData.two_factor_enabled ? 1 : 0,
      userData.two_factor_secret || null,
      userData.backup_codes ? JSON.stringify(userData.backup_codes) : null,
      userData.last_login || null,
      userData.failed_login_attempts,
      userData.account_locked_until || null,
      now,
      now
    );

    res.json({ success: true, result: { lastInsertRowid: nextId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by Google ID
app.get('/api/users/google/:googleId', (req, res) => {
  try {
    const { googleId } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(decodeURIComponent(googleId));

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userData } = req.body;

    if (!id || !userData) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const fields = Object.keys(userData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(userData), id];

    const stmt = db.prepare(`UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`);
    const result = stmt.run(values);

    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user login attempts
app.put('/api/users/:id/login-attempts', (req, res) => {
  try {
    const { id } = req.params;
    const { attempts, lockedUntil } = req.body;

    const stmt = db.prepare(`
      UPDATE users
      SET failed_login_attempts = ?, account_locked_until = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(attempts, lockedUntil || null, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user last login
app.put('/api/users/:id/last-login', (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      UPDATE users
      SET last_login = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify user email
app.put('/api/users/:id/verify-email', (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      UPDATE users
      SET email_verified = 1, updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enable user 2FA
app.put('/api/users/:id/2fa/enable', (req, res) => {
  try {
    const { id } = req.params;
    const { secret, backupCodes } = req.body;

    const stmt = db.prepare(`
      UPDATE users
      SET two_factor_enabled = 1, two_factor_secret = ?, backup_codes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(secret, JSON.stringify(backupCodes), id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Disable user 2FA
app.put('/api/users/:id/2fa/disable', (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      UPDATE users
      SET two_factor_enabled = 0, two_factor_secret = NULL, backup_codes = NULL, updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PASSWORD RESET API =====
// Request password reset
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ success: true, message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    // Generate password reset token
    const tokenPayload = {
      email: user.email,
      userId: user.id,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    // TODO: Send password reset email here
    // For now, we'll just return success

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { token })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and password are required' });
    }

    // Verify the token
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      if (payload.exp && Date.now() > payload.exp * 1000) {
        return res.status(400).json({ success: false, error: 'Reset token has expired' });
      }

      if (payload.type !== 'password_reset') {
        return res.status(400).json({ success: false, error: 'Invalid token type' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ? AND id = ?').get(payload.email, payload.userId);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Hash the new password
      const bcrypt = require('bcrypt');
      const saltRounds = 12;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);

      // Update user password and reset failed attempts
      const stmt = db.prepare(`
        UPDATE users
        SET password_hash = ?, failed_login_attempts = 0, account_locked_until = NULL, updated_at = datetime('now')
        WHERE id = ?
      `);

      stmt.run(hashedPassword, user.id);

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (tokenError) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== EMAIL VERIFICATION API =====
// Verify email with token
app.post('/api/auth/verify-email', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    // Verify the token (you'll need to implement token verification)
    // For now, we'll extract user info from a simple JWT-like token
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      if (payload.exp && Date.now() > payload.exp * 1000) {
        return res.status(400).json({ success: false, error: 'Token has expired' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(payload.email);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (user.email_verified) {
        return res.json({ success: true, message: 'Email already verified' });
      }

      // Update user as verified
      const stmt = db.prepare(`
        UPDATE users
        SET email_verified = 1, updated_at = datetime('now')
        WHERE id = ?
      `);

      stmt.run(user.id);

      res.json({ success: true, message: 'Email verified successfully' });
    } catch (tokenError) {
      return res.status(400).json({ success: false, error: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.email_verified) {
      return res.json({ success: true, message: 'Email is already verified' });
    }

    // Generate new verification token
    const tokenPayload = {
      email: user.email,
      userId: user.id,
      type: 'email_verification',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

    // TODO: Send verification email here
    // For now, we'll just return success

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { token })
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// ===== INVOICE MANAGEMENT API =====
app.get('/api/invoices', (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        (c.address || ', ' || c.city || ', ' || c.state || ' ' || c.zipCode) as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `).all();
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare(`
      SELECT
        i.*,
        c.name as client_name,
        COALESCE(i.client_email, c.email) as client_email,
        COALESCE(i.client_phone, c.phone) as client_phone,
        COALESCE(i.client_address, c.address || ', ' || c.city || ', ' || c.state || ' ' || c.zipCode) as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `).get(id);

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/invoices', (req, res) => {
  try {
    const { invoiceData } = req.body;

    if (!invoiceData) {
      return res.status(400).json({ success: false, error: 'Invoice data is required' });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('invoices');
    const currentValue = counterResult?.value || 0;
    const nextValue = currentValue + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextValue, 'invoices');

    const now = new Date().toISOString();

    // Calculate total amount
    const amount = invoiceData.amount || 0;
    const taxAmount = invoiceData.tax_amount || 0;
    const shippingAmount = invoiceData.shipping_amount || 0;
    const totalAmount = amount + taxAmount + shippingAmount;

    const stmt = db.prepare(`
      INSERT INTO invoices (id, invoice_number, client_id, template_id, amount, tax_amount, total_amount, status, due_date, issue_date, description,
                           stripe_invoice_id, type, client_name, client_email, client_phone, client_address,
                           line_items, tax_rate_id, shipping_amount, shipping_rate_id, notes,
                           email_status, email_sent_at, email_error, last_email_attempt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nextValue,
      invoiceData.invoice_number,
      invoiceData.client_id,
      invoiceData.template_id || null,
      amount,
      taxAmount,
      totalAmount,
      invoiceData.status || 'draft',
      invoiceData.due_date,
      invoiceData.issue_date || now.split('T')[0], // Use current date if not provided
      invoiceData.description || '',
      invoiceData.stripe_invoice_id || null,
      invoiceData.type || 'one-time',
      invoiceData.client_name || '',
      invoiceData.client_email || '',
      invoiceData.client_phone || '',
      invoiceData.client_address || '',
      invoiceData.line_items || null,
      invoiceData.tax_rate_id || null,
      shippingAmount,
      invoiceData.shipping_rate_id || null,
      invoiceData.notes || '',
      invoiceData.email_status || 'not_sent',
      invoiceData.email_sent_at || null,
      invoiceData.email_error || null,
      invoiceData.last_email_attempt || null,
      now,
      now
    );

    res.json({ success: true, result: { lastInsertRowid: nextValue } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceData } = req.body;

    if (!id || !invoiceData) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const fields = Object.keys(invoiceData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(invoiceData), id];

    const stmt = db.prepare(`UPDATE invoices SET ${fields}, updated_at = datetime('now') WHERE id = ?`);
    const result = stmt.run(values);

    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
    const result = stmt.run(id);
    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== EXPENSE MANAGEMENT API =====
app.get('/api/expenses', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM expenses';
    let params = [];

    if (startDate && endDate) {
      query += ' WHERE date(date) >= date(?) AND date(date) <= date(?)';
      params = [startDate, endDate];
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const expenses = db.prepare(query).all(params);
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const { expenseData } = req.body;

    if (!expenseData) {
      return res.status(400).json({ success: false, error: 'Expense data is required' });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('expenses');
    const currentValue = counterResult?.value || 0;
    const nextValue = currentValue + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextValue, 'expenses');

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO expenses (id, description, amount, category, date, receipt_url, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      nextValue,
      expenseData.description,
      expenseData.amount,
      expenseData.category || 'general',
      expenseData.date,
      expenseData.receipt_url || null,
      expenseData.notes || '',
      now,
      now
    );

    res.json({ success: true, result: { lastInsertRowid: nextValue } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { expenseData } = req.body;

    if (!id || !expenseData) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const fields = Object.keys(expenseData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(expenseData), id];

    const stmt = db.prepare(`UPDATE expenses SET ${fields}, updated_at = datetime('now') WHERE id = ?`);
    const result = stmt.run(values);

    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    const result = stmt.run(id);
    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== TEMPLATE RECOVERY ENDPOINT =====
app.post('/api/templates/recover', (req, res) => {
  try {
    // Check if templates_backup table exists
    const backupTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='templates_backup'").get();
    if (!backupTableExists) {
      return res.json({ success: false, message: 'No backup table found' });
    }

    const backupTemplates = db.prepare('SELECT * FROM templates_backup').all();
    const mainTemplates = db.prepare('SELECT * FROM templates').all();

    console.log(`Found ${backupTemplates.length} templates in backup table and ${mainTemplates.length} in main table`);

    if (backupTemplates.length === 0) {
      return res.json({ success: false, message: 'No templates found in backup table' });
    }

    let recoveredCount = 0;

    for (const template of backupTemplates) {
      try {
        // Map old template structure to new structure
        const migratedTemplate = {
          id: template.id,
          name: template.name || 'Untitled Template',
          client_id: template.client_id || 1, // Default to first client if missing
          amount: template.amount || 0,
          description: template.description || template.items || '',
          frequency: template.frequency || 'monthly',
          payment_terms: template.payment_terms || 'net_30',
          next_invoice_date: template.next_invoice_date || new Date().toISOString().split('T')[0],
          is_active: template.status === 'active' ? 1 : 0,
          line_items: template.items || null,
          tax_amount: template.tax_amount || 0,
          tax_rate_id: template.tax_rate_id || null,
          shipping_amount: template.shipping_amount || 0,
          shipping_rate_id: template.shipping_rate_id || null,
          notes: template.notes || null,
          created_at: template.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                                    next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                                    shipping_amount, shipping_rate_id, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          migratedTemplate.id,
          migratedTemplate.name,
          migratedTemplate.client_id,
          migratedTemplate.amount,
          migratedTemplate.description,
          migratedTemplate.frequency,
          migratedTemplate.payment_terms,
          migratedTemplate.next_invoice_date,
          migratedTemplate.is_active,
          migratedTemplate.line_items,
          migratedTemplate.tax_amount,
          migratedTemplate.tax_rate_id,
          migratedTemplate.shipping_amount,
          migratedTemplate.shipping_rate_id,
          migratedTemplate.notes,
          migratedTemplate.created_at,
          migratedTemplate.updated_at
        );

        recoveredCount++;
        console.log(`Successfully recovered template: ${migratedTemplate.name}`);
      } catch (templateError) {
        console.error(`Failed to recover template ${template.id}:`, templateError.message);
      }
    }

    // Clean up backup table
    db.exec('DROP TABLE IF EXISTS templates_backup');
    console.log('Template recovery completed and backup table cleaned up');

    res.json({
      success: true,
      message: `Successfully recovered ${recoveredCount} templates`,
      recoveredCount
    });
  } catch (error) {
    console.error('Template recovery failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== TEMPLATE MANAGEMENT API =====
app.get('/api/templates', (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT
        t.*,
        c.name as client_name
      FROM templates t
      LEFT JOIN clients c ON t.client_id = c.id
      ORDER BY t.created_at DESC
    `).all();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const template = db.prepare(`
      SELECT
        t.*,
        c.name as client_name
      FROM templates t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = ?
    `).get(id);

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const { templateData } = req.body;

    if (!templateData) {
      return res.status(400).json({ success: false, error: 'Template data is required' });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('templates');
    const currentValue = counterResult?.value || 0;
    const nextValue = currentValue + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextValue, 'templates');

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                            next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                            shipping_amount, shipping_rate_id, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      nextValue,
      templateData.name,
      templateData.client_id,
      templateData.amount,
      templateData.description || '',
      templateData.frequency,
      templateData.payment_terms || '',
      templateData.next_invoice_date,
      templateData.is_active ? 1 : 0,
      templateData.line_items || null,
      templateData.tax_amount || 0,
      templateData.tax_rate_id || null,
      templateData.shipping_amount || 0,
      templateData.shipping_rate_id || null,
      templateData.notes || '',
      now,
      now
    );

    res.json({ success: true, result: { lastInsertRowid: nextValue } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { templateData } = req.body;

    if (!id || !templateData) {
      return res.status(400).json({ success: false, error: 'Invalid parameters' });
    }

    const fields = Object.keys(templateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(templateData), id];

    const stmt = db.prepare(`UPDATE templates SET ${fields}, updated_at = datetime('now') WHERE id = ?`);
    const result = stmt.run(values);

    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
    const result = stmt.run(id);
    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PROJECT SETTINGS API =====
// Get project configuration (combines .env defaults with database overrides)
app.get('/api/project-settings', (_req, res) => {
  try {
    // Get all project settings from database
    const dbSettings = db.prepare('SELECT key, value, enabled FROM project_settings').all();

    // Create settings object with .env defaults
    const projectSettings = {
      google_oauth: {
        enabled: false,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      },
      stripe: {
        enabled: false,
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || '',
        configured: !!(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY)
      },
      email: {
        enabled: false,
        smtp_host: process.env.SMTP_HOST || '',
        smtp_port: process.env.SMTP_PORT || 587,
        smtp_user: process.env.SMTP_USER || '',
        email_from: process.env.EMAIL_FROM || '',
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
      },
      security: {
        require_email_verification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
        max_failed_login_attempts: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5,
        account_lockout_duration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION) || 1800000
      }
    };

    // Apply database overrides
    dbSettings.forEach(setting => {
      const keys = setting.key.split('.');
      let current = projectSettings;

      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      // Set the value and enabled status
      const lastKey = keys[keys.length - 1];
      try {
        const parsedValue = JSON.parse(setting.value);
        current[lastKey] = parsedValue;
      } catch {
        current[lastKey] = setting.value;
      }

      // Set enabled status if it exists
      if (setting.enabled !== null) {
        current.enabled = setting.enabled === 1;
      }
    });

    res.json({ success: true, settings: projectSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update project settings
app.put('/api/project-settings', (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Settings object is required' });
    }

    // Flatten the settings object for database storage
    const flattenSettings = (obj, prefix = '') => {
      const flattened = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (key === 'enabled') {
          // Handle enabled flag separately
          continue;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattened.push(...flattenSettings(value, fullKey));
        } else {
          flattened.push({
            key: fullKey,
            value: JSON.stringify(value),
            enabled: obj.enabled !== undefined ? (obj.enabled ? 1 : 0) : null
          });
        }
      }
      return flattened;
    };

    const flatSettings = flattenSettings(settings);

    // Use transaction for bulk updates
    const stmt = db.prepare('INSERT OR REPLACE INTO project_settings (key, value, enabled) VALUES (?, ?, ?)');
    const transaction = db.transaction((settingsData) => {
      for (const setting of settingsData) {
        stmt.run(setting.key, setting.value, setting.enabled);
      }
    });

    transaction(flatSettings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== REPORTS MANAGEMENT API =====
app.get('/api/reports', (req, res) => {
  try {
    const reports = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Parse data field if it exists
    if (report.data) {
      try {
        report.data = JSON.parse(report.data);
      } catch (e) {
        console.warn('Failed to parse report data:', e);
      }
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/reports', (req, res) => {
  try {
    const { reportData } = req.body;

    if (!reportData) {
      return res.status(400).json({ success: false, error: 'Report data is required' });
    }

    // Get next ID
    const counterResult = db.prepare('SELECT value FROM counters WHERE name = ?').get('reports');
    const currentValue = counterResult?.value || 0;
    const nextValue = currentValue + 1;
    db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(nextValue, 'reports');

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO reports (id, name, type, date_range_start, date_range_end, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      nextValue,
      reportData.name,
      reportData.type,
      reportData.date_range_start,
      reportData.date_range_end,
      JSON.stringify(reportData.data || {}),
      now
    );

    res.json({ success: true, result: { lastInsertRowid: nextValue } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    const result = stmt.run(id);
    res.json({ success: true, result: { changes: result.changes } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Settings operations

// Get all settings or filter by category
app.get('/api/settings', (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT key, value, category FROM settings';
    let params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, key';

    const results = db.prepare(query).all(params);
    const settings = {};

    results.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    });

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get individual setting by key
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

// Save individual setting
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

// Save multiple settings at once
app.put('/api/settings', (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Settings object is required' });
    }

    // Use a transaction for bulk updates
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)');
    const transaction = db.transaction((settingsData) => {
      for (const [key, data] of Object.entries(settingsData)) {
        const { value, category = 'general' } = data;
        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
        stmt.run(key, jsonValue, category);
      }
    });

    transaction(settings);
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
