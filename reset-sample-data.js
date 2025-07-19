// Reset and create realistic sample data for the dashboard
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database setup
const dataDir = join(__dirname, 'data');
const dbPath = join(dataDir, 'slimbooks.db');

console.log('🔄 Resetting Sample Data');
console.log('📁 Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Clear existing invoices and expenses only (keep clients)
  console.log('\n1. Clearing existing invoices and expenses...');
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM expenses').run();

  // Reset counters for invoices and expenses only
  db.prepare('UPDATE counters SET value = 0 WHERE name = ?').run('invoices');
  db.prepare('UPDATE counters SET value = 0 WHERE name = ?').run('expenses');

  console.log('✅ Existing invoices and expenses cleared');

  // Get existing clients
  console.log('\n2. Using existing clients...');
  const existingClients = db.prepare('SELECT * FROM clients ORDER BY id').all();
  console.log(`✅ Found ${existingClients.length} existing clients`);

  // Create realistic invoices with proper business logic
  console.log('\n3. Creating realistic invoices...');
  const invoiceStmt = db.prepare(`
    INSERT INTO invoices (id, invoice_number, client_id, amount, total_amount, status, due_date, issue_date, description, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const now = new Date().toISOString();

  // Helper function to create dates
  const createDate = (daysOffset) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  };

  // Use existing client IDs
  const clientIds = existingClients.map(c => c.id);

  const invoices = [
    // PAID INVOICES (completed work, payments received)
    [1, 'INV-0001', clientIds[0] || 1, 5000.00, 5000.00, 'paid', createDate(-45), createDate(-60), 'Website Development Project', 'one-time', createDate(-60), now],
    [2, 'INV-0002', clientIds[1] || 2, 2500.00, 2500.00, 'paid', createDate(-30), createDate(-45), 'Dental Practice Website', 'one-time', createDate(-45), now],
    [3, 'INV-0003', clientIds[2] || 3, 3200.00, 3200.00, 'paid', createDate(-20), createDate(-35), 'Gym Management System', 'one-time', createDate(-35), now],
    [4, 'INV-0004', clientIds[3] || 4, 1800.00, 1800.00, 'paid', createDate(-15), createDate(-30), 'Logo Design Package', 'one-time', createDate(-30), now],

    // SENT INVOICES (work completed, invoices sent, awaiting payment)
    [5, 'INV-0005', clientIds[4] || 1, 1500.00, 1500.00, 'sent', createDate(15), createDate(-5), 'Restaurant POS Integration', 'one-time', createDate(-5), now],
    [6, 'INV-0006', clientIds[5] || 2, 2200.00, 2200.00, 'sent', createDate(20), createDate(-3), 'E-commerce Platform', 'one-time', createDate(-3), now],
    [7, 'INV-0007', clientIds[6] || 3, 800.00, 800.00, 'sent', createDate(10), createDate(-7), 'Coffee Shop Website', 'one-time', createDate(-7), now],
    [8, 'INV-0008', clientIds[7] || 4, 4500.00, 4500.00, 'sent', createDate(25), createDate(-2), 'Legal Document Management System', 'one-time', createDate(-2), now],

    // OVERDUE INVOICES (sent but past due date)
    [9, 'INV-0009', clientIds[0] || 1, 1200.00, 1200.00, 'overdue', createDate(-10), createDate(-25), 'Monthly Maintenance', 'one-time', createDate(-25), now],
    [10, 'INV-0010', clientIds[1] || 2, 950.00, 950.00, 'overdue', createDate(-5), createDate(-20), 'Security Updates', 'one-time', createDate(-20), now],
    [11, 'INV-0011', clientIds[2] || 3, 600.00, 600.00, 'overdue', createDate(-3), createDate(-18), 'SEO Optimization', 'one-time', createDate(-18), now],

    // DRAFT INVOICES (work in progress, not yet sent)
    [12, 'INV-0012', clientIds[3] || 4, 3500.00, 3500.00, 'draft', createDate(30), createDate(-1), 'Mobile App Development', 'one-time', createDate(-1), now],
    [13, 'INV-0013', clientIds[4] || 1, 1100.00, 1100.00, 'draft', createDate(35), createDate(-1), 'Inventory Management System', 'one-time', createDate(-1), now],
    [14, 'INV-0014', clientIds[5] || 2, 2800.00, 2800.00, 'draft', createDate(40), createDate(-1), 'Member Portal Development', 'one-time', createDate(-1), now],
    [15, 'INV-0015', clientIds[6] || 3, 750.00, 750.00, 'draft', createDate(25), createDate(-1), 'Brand Identity Package', 'one-time', createDate(-1), now],
    [16, 'INV-0016', clientIds[7] || 4, 5200.00, 5200.00, 'draft', createDate(45), createDate(-1), 'Case Management System', 'one-time', createDate(-1), now]
  ];

  invoices.forEach(invoice => invoiceStmt.run(...invoice));
  console.log(`✅ Created ${invoices.length} invoices`);

  // Create realistic expenses
  console.log('\n4. Creating realistic expenses...');
  const expenseStmt = db.prepare(`
    INSERT INTO expenses (id, date, merchant, category, amount, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const expenses = [
    [1, createDate(-30), 'Adobe', 'Software', 52.99, 'Creative Cloud Subscription', 'approved', now, now],
    [2, createDate(-25), 'AWS', 'Hosting', 125.00, 'Cloud Hosting Services', 'approved', now, now],
    [3, createDate(-20), 'Office Depot', 'Office Supplies', 89.50, 'Printer Paper and Ink', 'approved', now, now],
    [4, createDate(-18), 'Starbucks', 'Meals', 45.75, 'Client Meeting Coffee', 'approved', now, now],
    [5, createDate(-15), 'Uber', 'Transportation', 28.50, 'Client Site Visit', 'approved', now, now],
    [6, createDate(-12), 'GitHub', 'Software', 21.00, 'Pro Subscription', 'approved', now, now],
    [7, createDate(-10), 'Zoom', 'Software', 14.99, 'Video Conferencing', 'approved', now, now],
    [8, createDate(-8), 'FedEx', 'Shipping', 35.20, 'Contract Delivery', 'approved', now, now],
    [9, createDate(-5), 'Slack', 'Software', 12.50, 'Team Communication', 'approved', now, now],
    [10, createDate(-3), 'Domain.com', 'Software', 15.99, 'Domain Registration', 'pending', now, now]
  ];

  expenses.forEach(expense => expenseStmt.run(...expense));
  console.log(`✅ Created ${expenses.length} expenses`);

  // Update counters
  console.log('\n5. Updating counters...');
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(invoices.length, 'invoices');
  db.prepare('UPDATE counters SET value = ? WHERE name = ?').run(expenses.length, 'expenses');

  // Calculate and display summary
  console.log('\n6. Summary of realistic data:');
  console.log('='.repeat(50));
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv[3], 0);
  const paidRevenue = invoices.filter(inv => inv[5] === 'paid').reduce((sum, inv) => sum + inv[3], 0);
  const pendingRevenue = invoices.filter(inv => inv[5] === 'sent').reduce((sum, inv) => sum + inv[3], 0);
  const overdueRevenue = invoices.filter(inv => inv[5] === 'overdue').reduce((sum, inv) => sum + inv[3], 0);
  const draftRevenue = invoices.filter(inv => inv[5] === 'draft').reduce((sum, inv) => sum + inv[3], 0);
  const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp[4], 0);

  console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`✅ Paid: $${paidRevenue.toFixed(2)} (${invoices.filter(inv => inv[5] === 'paid').length} invoices)`);
  console.log(`📤 Pending: $${pendingRevenue.toFixed(2)} (${invoices.filter(inv => inv[5] === 'sent').length} invoices)`);
  console.log(`⚠️  Overdue: $${overdueRevenue.toFixed(2)} (${invoices.filter(inv => inv[5] === 'overdue').length} invoices)`);
  console.log(`📝 Draft: $${draftRevenue.toFixed(2)} (${invoices.filter(inv => inv[5] === 'draft').length} invoices)`);
  console.log(`👥 Clients: ${existingClients.length}`);
  console.log(`💸 Expenses: $${totalExpenseAmount.toFixed(2)} (${expenses.length} expenses)`);

  console.log('\n✅ Realistic sample data created successfully!');
  console.log('🌐 Refresh your dashboard at http://localhost:4173 to see the updated data');

  db.close();

} catch (error) {
  console.error('❌ Error resetting sample data:', error);
  process.exit(1);
}
