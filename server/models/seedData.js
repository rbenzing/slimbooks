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
    // Counters initialized silently
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
      // Admin user already exists (silent)
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

    if (clientCount.count === 0) {
      console.log(`📊 Adding sample data: ${clientCount.count} clients found, creating samples...`);

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
        // 2024 expenses
        [1, 'Office Depot', 250.00, 'Office Supplies', 'Printer paper and ink cartridges', '2024-01-10', 'approved', null, '2024-01-10T14:20:00Z'],
        [2, 'Starbucks', 45.50, 'Meals & Entertainment', 'Client meeting coffee', '2024-01-15', 'approved', null, '2024-01-15T16:30:00Z'],
        [3, 'Adobe', 52.99, 'Software', 'Creative Cloud subscription', '2024-02-01', 'approved', null, '2024-02-01T10:00:00Z'],
        [4, 'Uber', 28.75, 'Transportation', 'Client meeting transportation', '2024-02-10', 'approved', null, '2024-02-10T18:45:00Z'],
        [5, 'AWS', 125.00, 'Software', 'Cloud hosting services', '2024-02-15', 'approved', null, '2024-02-15T12:00:00Z'],
        [6, 'FedEx', 35.20, 'Shipping', 'Document delivery to client', '2024-03-01', 'pending', null, '2024-03-01T11:15:00Z'],

        // 2025 expenses (current year)
        [7, 'Microsoft', 99.99, 'Software', 'Office 365 subscription', '2025-01-05', 'approved', null, '2025-01-05T09:00:00Z'],
        [8, 'Zoom', 14.99, 'Software', 'Video conferencing subscription', '2025-01-15', 'approved', null, '2025-01-15T10:30:00Z'],
        [9, 'Staples', 75.25, 'Office Supplies', 'Office supplies and stationery', '2025-02-03', 'approved', null, '2025-02-03T14:15:00Z'],
        [10, 'Lyft', 32.50, 'Transportation', 'Airport transportation', '2025-02-10', 'approved', null, '2025-02-10T16:20:00Z'],
        [11, 'GitHub', 21.00, 'Software', 'GitHub Pro subscription', '2025-03-01', 'approved', null, '2025-03-01T11:00:00Z'],
        [12, 'Slack', 8.75, 'Software', 'Team communication tool', '2025-03-15', 'pending', null, '2025-03-15T13:45:00Z'],
        [13, 'Dell', 1299.99, 'Equipment', 'New laptop for development', '2025-07-01', 'approved', null, '2025-07-01T10:00:00Z'],
        [14, 'Best Buy', 89.99, 'Equipment', 'Wireless mouse and keyboard', '2025-07-15', 'approved', null, '2025-07-15T15:30:00Z']
      ];

      sampleExpenses.forEach(expense => expenseStmt.run(...expense));

      // Update counters
      db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(4, 'clients');
      db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(14, 'expenses');

      console.log('✅ Sample data added: 4 clients, 14 expenses');
    } else {
      console.log(`📊 Sample data exists: ${clientCount.count} clients`);
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
    // Check if we have historical data (invoices from 2024 or earlier)
    const historicalCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE created_at < ?').get('2025-01-01');

    if (invoiceCount.count === 0 || historicalCount.count === 0) {
      console.log(`📋 Adding sample invoices: ${invoiceCount.count} existing...`);

      // Get first few clients
      const clients = db.prepare('SELECT * FROM clients ORDER BY id LIMIT 4').all();

      if (clients.length > 0) {
        const invoiceStmt = db.prepare(`
          INSERT OR IGNORE INTO invoices (id, invoice_number, client_id, amount, tax_amount, total_amount, status, due_date, issue_date, description, items, line_items, type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const sampleInvoices = [
          // Current year invoices
          [1, 'INV-2025-001', clients[0]?.id || 1, 5000.00, 500.00, 5500.00, 'paid', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`, 'Website Development', '[{"description":"Website Development","quantity":1,"rate":5000,"amount":5000}]', '[{"id":"1","description":"Website Development","quantity":1,"rate":5000,"amount":5000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01T10:00:00Z`],
          [2, 'INV-2025-002', clients[1]?.id || 2, 3000.00, 300.00, 3300.00, 'paid', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`, 'Logo Design Package', '[{"description":"Logo Design Package","quantity":1,"rate":3000,"amount":3000}]', '[{"id":"1","description":"Logo Design Package","quantity":1,"rate":3000,"amount":3000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05T14:30:00Z`],
          [3, 'INV-2025-003', clients[0]?.id || 1, 2500.00, 250.00, 2750.00, 'sent', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-25`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`, 'Mobile App Consultation', '[{"description":"Mobile App Consultation","quantity":10,"rate":250,"amount":2500}]', '[{"id":"1","description":"Mobile App Consultation","quantity":10,"rate":250,"amount":2500}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10T11:20:00Z`],
          [4, 'INV-2025-004', clients[2]?.id || 3, 4000.00, 400.00, 4400.00, 'sent', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-30`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12`, 'Backend API Development', '[{"description":"Backend API Development","quantity":1,"rate":4000,"amount":4000}]', '[{"id":"1","description":"Backend API Development","quantity":1,"rate":4000,"amount":4000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12T13:10:00Z`],
          [5, 'INV-2025-005', clients[3]?.id || 4, 1500.00, 150.00, 1650.00, 'overdue', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`, `${currentYear}-${String(currentMonth).padStart(2, '0')}-25`, 'Business Strategy Consultation', '[{"description":"Business Strategy Consultation","quantity":6,"rate":250,"amount":1500}]', '[{"id":"1","description":"Business Strategy Consultation","quantity":6,"rate":250,"amount":1500}]', 'one-time', `${currentYear}-${String(currentMonth).padStart(2, '0')}-25T15:30:00Z`],
          [6, 'INV-2025-006', clients[1]?.id || 2, 2000.00, 200.00, 2200.00, 'draft', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`, `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`, 'Brand Guidelines', '[{"description":"Brand Guidelines","quantity":1,"rate":2000,"amount":2000}]', '[{"id":"1","description":"Brand Guidelines","quantity":1,"rate":2000,"amount":2000}]', 'one-time', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15T09:45:00Z`],

          // 2024 invoices (last year)
          [7, 'INV-2024-001', clients[0]?.id || 1, 4500.00, 450.00, 4950.00, 'paid', '2024-12-15', '2024-12-01', 'E-commerce Platform', '[{"description":"E-commerce Platform","quantity":1,"rate":4500,"amount":4500}]', '[{"id":"1","description":"E-commerce Platform","quantity":1,"rate":4500,"amount":4500}]', 'one-time', '2024-12-01T10:00:00Z'],
          [8, 'INV-2024-002', clients[1]?.id || 2, 2800.00, 280.00, 3080.00, 'paid', '2024-11-20', '2024-11-05', 'Brand Identity Package', '[{"description":"Brand Identity Package","quantity":1,"rate":2800,"amount":2800}]', '[{"id":"1","description":"Brand Identity Package","quantity":1,"rate":2800,"amount":2800}]', 'one-time', '2024-11-05T14:30:00Z'],
          [9, 'INV-2024-003', clients[2]?.id || 3, 3200.00, 320.00, 3520.00, 'paid', '2024-10-25', '2024-10-10', 'API Integration', '[{"description":"API Integration","quantity":1,"rate":3200,"amount":3200}]', '[{"id":"1","description":"API Integration","quantity":1,"rate":3200,"amount":3200}]', 'one-time', '2024-10-10T11:20:00Z'],
          [10, 'INV-2024-004', clients[3]?.id || 4, 1800.00, 180.00, 1980.00, 'paid', '2024-09-30', '2024-09-12', 'Marketing Strategy', '[{"description":"Marketing Strategy","quantity":1,"rate":1800,"amount":1800}]', '[{"id":"1","description":"Marketing Strategy","quantity":1,"rate":1800,"amount":1800}]', 'one-time', '2024-09-12T13:10:00Z'],
          [11, 'INV-2024-005', clients[0]?.id || 1, 2200.00, 220.00, 2420.00, 'paid', '2024-08-15', '2024-08-01', 'Database Optimization', '[{"description":"Database Optimization","quantity":1,"rate":2200,"amount":2200}]', '[{"id":"1","description":"Database Optimization","quantity":1,"rate":2200,"amount":2200}]', 'one-time', '2024-08-01T15:30:00Z'],
          [12, 'INV-2024-006', clients[1]?.id || 2, 3500.00, 350.00, 3850.00, 'paid', '2024-07-20', '2024-07-05', 'UI/UX Redesign', '[{"description":"UI/UX Redesign","quantity":1,"rate":3500,"amount":3500}]', '[{"id":"1","description":"UI/UX Redesign","quantity":1,"rate":3500,"amount":3500}]', 'one-time', '2024-07-05T09:45:00Z'],

          // 2023 invoices (year before last)
          [13, 'INV-2023-001', clients[0]?.id || 1, 4000.00, 400.00, 4400.00, 'paid', '2023-12-15', '2023-12-01', 'Legacy System Migration', '[{"description":"Legacy System Migration","quantity":1,"rate":4000,"amount":4000}]', '[{"id":"1","description":"Legacy System Migration","quantity":1,"rate":4000,"amount":4000}]', 'one-time', '2023-12-01T10:00:00Z'],
          [14, 'INV-2023-002', clients[2]?.id || 3, 2500.00, 250.00, 2750.00, 'paid', '2023-11-20', '2023-11-05', 'Security Audit', '[{"description":"Security Audit","quantity":1,"rate":2500,"amount":2500}]', '[{"id":"1","description":"Security Audit","quantity":1,"rate":2500,"amount":2500}]', 'one-time', '2023-11-05T14:30:00Z'],
          [15, 'INV-2023-003', clients[1]?.id || 2, 3000.00, 300.00, 3300.00, 'paid', '2023-10-25', '2023-10-10', 'Content Management System', '[{"description":"Content Management System","quantity":1,"rate":3000,"amount":3000}]', '[{"id":"1","description":"Content Management System","quantity":1,"rate":3000,"amount":3000}]', 'one-time', '2023-10-10T11:20:00Z'],
          [16, 'INV-2023-004', clients[3]?.id || 4, 1600.00, 160.00, 1760.00, 'paid', '2023-09-30', '2023-09-12', 'SEO Optimization', '[{"description":"SEO Optimization","quantity":1,"rate":1600,"amount":1600}]', '[{"id":"1","description":"SEO Optimization","quantity":1,"rate":1600,"amount":1600}]', 'one-time', '2023-09-12T13:10:00Z']
        ];

        sampleInvoices.forEach(invoice => {
          try {
            invoiceStmt.run(...invoice);
          } catch (err) {
            // Invoice might already exist (silent)
          }
        });

        // Update invoice counter
        try {
          db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(16, 'invoices');
        } catch (err) {
          // Counter update error (silent)
        }

        console.log('✅ Sample invoices added (2023-2025)');
      }
    } else {
      console.log(`📋 Invoices exist: ${invoiceCount.count} total`);
    }
  } catch (error) {
    console.error('Error adding sample invoices:', error);
  }
};
