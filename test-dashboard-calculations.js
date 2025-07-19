// Dashboard Calculation Verification Test
// This script tests the dashboard metrics calculations against the SQLite database

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database setup
const dataDir = join(__dirname, 'data');
const dbPath = join(dataDir, 'slimbooks.db');

console.log('🔍 Testing Dashboard Calculations');
console.log('📁 Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n📊 Raw Database Data:');
  console.log('='.repeat(50));
  
  // Get all invoices
  const invoices = db.prepare(`
    SELECT
      i.*,
      c.name as client_name
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
  `).all();
  
  console.log(`📋 Total invoices in database: ${invoices.length}`);
  
  // Get all clients
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  console.log(`👥 Total clients in database: ${clients.length}`);
  
  // Get all expenses
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all();
  console.log(`💰 Total expenses in database: ${expenses.length}`);
  
  console.log('\n🧮 Manual Calculations:');
  console.log('='.repeat(50));
  
  // Calculate total revenue
  const totalRevenue = invoices.reduce((sum, invoice) => {
    const amount = parseFloat(invoice.amount) || 0;
    console.log(`Invoice ${invoice.invoice_number}: $${amount} (${invoice.status})`);
    return sum + amount;
  }, 0);
  
  console.log(`💵 Total Revenue: $${totalRevenue.toFixed(2)}`);
  
  // Calculate invoice status counts (using actual database statuses)
  const sentInvoices = invoices.filter(inv => inv.status === 'sent'); // invoices sent to clients
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const draftInvoices = invoices.filter(inv => inv.status === 'draft');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue'); // explicit overdue status

  console.log(`📤 Sent invoices: ${sentInvoices.length}`);
  console.log(`✅ Paid invoices: ${paidInvoices.length}`);
  console.log(`📝 Draft invoices: ${draftInvoices.length}`);
  console.log(`⚠️  Overdue invoices: ${overdueInvoices.length}`);

  // Show status breakdown
  console.log('\n📊 Status Breakdown:');
  const statusCounts = {};
  invoices.forEach(inv => {
    statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
  });
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} invoices`);
  });
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.amount) || 0;
    return sum + amount;
  }, 0);
  
  console.log(`💸 Total Expenses: $${totalExpenses.toFixed(2)}`);
  
  console.log('\n📈 Chart Data Analysis:');
  console.log('='.repeat(50));
  
  // Analyze invoice dates and amounts for chart data
  const monthlyData = {};
  const currentYear = new Date().getFullYear();
  
  invoices.forEach(invoice => {
    const date = new Date(invoice.created_at);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        revenue: 0,
        count: 0,
        invoices: []
      };
    }
    
    const amount = parseFloat(invoice.amount) || 0;
    monthlyData[monthKey].revenue += amount;
    monthlyData[monthKey].count += 1;
    monthlyData[monthKey].invoices.push({
      number: invoice.invoice_number,
      amount: amount,
      status: invoice.status,
      client: invoice.client_name
    });
  });
  
  console.log('Monthly breakdown:');
  Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      console.log(`${month}: $${data.revenue.toFixed(2)} (${data.count} invoices)`);
      data.invoices.forEach(inv => {
        console.log(`  - ${inv.number}: $${inv.amount} (${inv.status}) - ${inv.client}`);
      });
    });
  
  console.log('\n🔍 Data Validation:');
  console.log('='.repeat(50));
  
  // Check for data inconsistencies
  let issues = [];
  
  // Check for invoices with invalid amounts
  const invalidAmounts = invoices.filter(inv => {
    const amount = parseFloat(inv.amount);
    return isNaN(amount) || amount < 0;
  });
  
  if (invalidAmounts.length > 0) {
    issues.push(`❌ Found ${invalidAmounts.length} invoices with invalid amounts`);
    invalidAmounts.forEach(inv => {
      console.log(`  - Invoice ${inv.invoice_number}: amount = ${inv.amount}`);
    });
  }
  
  // Check for invoices without client names
  const missingClients = invoices.filter(inv => !inv.client_name);
  if (missingClients.length > 0) {
    issues.push(`❌ Found ${missingClients.length} invoices without client names`);
    missingClients.forEach(inv => {
      console.log(`  - Invoice ${inv.invoice_number}: client_id = ${inv.client_id}`);
    });
  }
  
  // Check for invalid dates
  const invalidDates = invoices.filter(inv => {
    const created = new Date(inv.created_at);
    const due = new Date(inv.due_date);
    return isNaN(created.getTime()) || isNaN(due.getTime());
  });
  
  if (invalidDates.length > 0) {
    issues.push(`❌ Found ${invalidDates.length} invoices with invalid dates`);
  }
  
  if (issues.length === 0) {
    console.log('✅ All data validation checks passed!');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(issue));
  }
  
  // Calculate credits/refunds
  const creditsRefunds = Math.abs(invoices.reduce((sum, invoice) => {
    const amount = parseFloat(invoice.amount) || 0;
    return amount < 0 ? sum + amount : sum;
  }, 0));

  // Calculate positive revenue only
  const positiveRevenue = invoices.reduce((sum, invoice) => {
    const amount = parseFloat(invoice.amount) || 0;
    return amount > 0 ? sum + amount : sum;
  }, 0);

  console.log('\n📋 Summary for Dashboard Verification:');
  console.log('='.repeat(50));
  console.log(`Total Revenue (positive only): $${positiveRevenue.toFixed(2)}`);
  console.log(`Total Revenue (including negatives): $${totalRevenue.toFixed(2)}`);
  console.log(`Credits/Refunds: $${creditsRefunds.toFixed(2)}`);
  console.log(`Total Clients: ${clients.length}`);
  console.log(`Total Invoices: ${invoices.length}`);
  console.log(`Sent Invoices: ${sentInvoices.length}`);
  console.log(`Paid Invoices: ${paidInvoices.length}`);
  console.log(`Draft Invoices: ${draftInvoices.length}`);
  console.log(`Overdue Invoices: ${overdueInvoices.length}`);
  console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
  
  db.close();
  
} catch (error) {
  console.error('❌ Error testing dashboard calculations:', error);
  process.exit(1);
}
