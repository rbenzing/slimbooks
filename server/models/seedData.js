// Database seed data for Slimbooks
// Handles initialization of counters, admin user, and sample data

import bcrypt from 'bcryptjs';

/**
 * Initialize counters if empty
 * @param {Database} db - SQLite database instance
 */
export const initializeCounters = (db) => {
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

/**
 * Initialize admin user
 * @param {Database} db - SQLite database instance
 */
export const initializeAdminUser = async (db) => {
  try {
    const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@slimbooks.app');

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('password', 12);
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

      console.log('✅ Admin user created: admin@slimbooks.app / password');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
};

/**
 * Initialize sample data for development
 * @param {Database} db - SQLite database instance
 */
export const initializeSampleData = (db) => {
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
      db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(6, 'expenses');

      console.log('✅ Sample data added successfully');
      console.log('   - 4 sample clients');
      console.log('   - 6 sample expenses');
    } else {
      console.log('✅ Sample data already exists');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

/**
 * Add sample invoices for existing clients
 * @param {Database} db - SQLite database instance
 */
export const addSampleInvoices = (db) => {
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
