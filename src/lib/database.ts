
import Database from 'better-sqlite3';

// Initialize SQLite database
const db = new Database('clientbill.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export const initDatabase = () => {
  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      company TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zipCode TEXT,
      country TEXT,
      stripe_customer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Invoice templates table (for recurring invoices)
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id INTEGER NOT NULL,
      frequency TEXT NOT NULL, -- monthly, quarterly, yearly
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      next_invoice_date DATE,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
    )
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      template_id INTEGER NULL,
      amount DECIMAL(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue
      due_date DATE NOT NULL,
      description TEXT,
      stripe_invoice_id TEXT,
      type TEXT NOT NULL DEFAULT 'one-time', -- one-time, recurring
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES invoice_templates (id) ON DELETE SET NULL
    )
  `);

  // Invoice line items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      template_id INTEGER,
      description TEXT NOT NULL,
      quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES invoice_templates (id) ON DELETE CASCADE
    )
  `);

  // Insert some sample data
  const insertClient = db.prepare(`
    INSERT OR IGNORE INTO clients (name, email, phone, company, address, city, state, zipCode, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertClient.run('Acme Corporation', 'contact@acme.com', '+1-555-0123', 'Acme Corp', '123 Business St', 'New York', 'NY', '10001', 'USA');
  insertClient.run('TechStart Inc', 'hello@techstart.com', '+1-555-0124', 'TechStart', '456 Innovation Ave', 'San Francisco', 'CA', '94105', 'USA');
  insertClient.run('Design Studio LLC', 'info@designstudio.com', '+1-555-0125', 'Design Studio', '789 Creative Blvd', 'Los Angeles', 'CA', '90210', 'USA');
};

// Client operations
export const clientOperations = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM clients ORDER BY created_at DESC');
    return stmt.all();
  },
  
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
    return stmt.get(id);
  },
  
  create: (client: any) => {
    const stmt = db.prepare(`
      INSERT INTO clients (name, email, phone, company, address, city, state, zipCode, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(client.name, client.email, client.phone, client.company, client.address, client.city, client.state, client.zipCode, client.country);
  },
  
  update: (id: number, client: any) => {
    const stmt = db.prepare(`
      UPDATE clients 
      SET name = ?, email = ?, phone = ?, company = ?, address = ?, city = ?, state = ?, zipCode = ?, country = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(client.name, client.email, client.phone, client.company, client.address, client.city, client.state, client.zipCode, client.country, id);
  },
  
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    return stmt.run(id);
  }
};

// Invoice operations
export const invoiceOperations = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      JOIN clients c ON i.client_id = c.id 
      ORDER BY i.created_at DESC
    `);
    return stmt.all();
  },
  
  getById: (id: number) => {
    const stmt = db.prepare(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      JOIN clients c ON i.client_id = c.id 
      WHERE i.id = ?
    `);
    return stmt.get(id);
  },
  
  create: (invoice: any) => {
    const stmt = db.prepare(`
      INSERT INTO invoices (invoice_number, client_id, amount, status, due_date, description, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(invoice.invoice_number, invoice.client_id, invoice.amount, invoice.status, invoice.due_date, invoice.description, invoice.type);
  },
  
  update: (id: number, invoice: any) => {
    const stmt = db.prepare(`
      UPDATE invoices 
      SET client_id = ?, amount = ?, status = ?, due_date = ?, description = ?, type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(invoice.client_id, invoice.amount, invoice.status, invoice.due_date, invoice.description, invoice.type, id);
  },
  
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
    return stmt.run(id);
  }
};

// Template operations
export const templateOperations = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT t.*, c.name as client_name 
      FROM invoice_templates t 
      JOIN clients c ON t.client_id = c.id 
      WHERE t.is_active = 1
      ORDER BY t.created_at DESC
    `);
    return stmt.all();
  },
  
  create: (template: any) => {
    const stmt = db.prepare(`
      INSERT INTO invoice_templates (name, client_id, frequency, amount, description, next_invoice_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(template.name, template.client_id, template.frequency, template.amount, template.description, template.next_invoice_date);
  },
  
  update: (id: number, template: any) => {
    const stmt = db.prepare(`
      UPDATE invoice_templates 
      SET name = ?, client_id = ?, frequency = ?, amount = ?, description = ?, next_invoice_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(template.name, template.client_id, template.frequency, template.amount, template.description, template.next_invoice_date, id);
  },
  
  delete: (id: number) => {
    const stmt = db.prepare('UPDATE invoice_templates SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
  }
};

// Initialize database on import
initDatabase();

export default db;
