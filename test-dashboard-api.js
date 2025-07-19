// Test Dashboard API and Frontend Integration
// This script tests the dashboard by making API calls to the backend
// and comparing with expected calculations

const API_BASE = 'http://localhost:3002/api';

async function testDashboardAPI() {
  console.log('🔍 Testing Dashboard API Integration');
  console.log('='.repeat(60));

  try {
    // Test backend health
    console.log('1. Testing backend connection...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (!healthResponse.ok) {
      throw new Error('Backend server not available');
    }
    console.log('✅ Backend server is running');

    // Get all invoices via API
    console.log('\n2. Fetching invoices via API...');
    const invoicesResponse = await fetch(`${API_BASE}/db/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: `
          SELECT
            i.*,
            c.name as client_name
          FROM invoices i
          LEFT JOIN clients c ON i.client_id = c.id
          ORDER BY i.created_at DESC
        `,
        params: []
      })
    });
    
    const invoicesData = await invoicesResponse.json();
    if (!invoicesData.success) {
      throw new Error('Failed to fetch invoices: ' + invoicesData.error);
    }
    
    const invoices = invoicesData.result;
    console.log(`📋 Fetched ${invoices.length} invoices via API`);

    // Get all clients via API
    console.log('\n3. Fetching clients via API...');
    const clientsResponse = await fetch(`${API_BASE}/db/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT * FROM clients ORDER BY created_at DESC',
        params: []
      })
    });
    
    const clientsData = await clientsResponse.json();
    if (!clientsData.success) {
      throw new Error('Failed to fetch clients: ' + clientsData.error);
    }
    
    const clients = clientsData.result;
    console.log(`👥 Fetched ${clients.length} clients via API`);

    // Get all expenses via API
    console.log('\n4. Fetching expenses via API...');
    const expensesResponse = await fetch(`${API_BASE}/db/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT * FROM expenses ORDER BY created_at DESC',
        params: []
      })
    });
    
    const expensesData = await expensesResponse.json();
    if (!expensesData.success) {
      throw new Error('Failed to fetch expenses: ' + expensesData.error);
    }
    
    const expenses = expensesData.result;
    console.log(`💰 Fetched ${expenses.length} expenses via API`);

    // Calculate metrics using the same logic as the dashboard
    console.log('\n5. Calculating dashboard metrics...');
    console.log('='.repeat(40));

    // Total revenue (excluding negative amounts)
    const totalRevenue = invoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.amount) || 0;
      return amount > 0 ? sum + amount : sum;
    }, 0);

    // Status counts using corrected mapping
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
    const draftInvoices = invoices.filter(inv => inv.status === 'draft').length;

    // Credits/refunds (negative amounts)
    const creditsRefunds = Math.abs(invoices.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.amount) || 0;
      return amount < 0 ? sum + amount : sum;
    }, 0));

    // Total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Display calculated metrics
    console.log(`💵 Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`👥 Total Clients: ${clients.length}`);
    console.log(`📄 Total Invoices: ${invoices.length}`);
    console.log(`📤 Pending Invoices (sent): ${pendingInvoices}`);
    console.log(`✅ Paid Invoices: ${paidInvoices}`);
    console.log(`⚠️  Overdue Invoices: ${overdueInvoices}`);
    console.log(`📝 Draft Invoices: ${draftInvoices}`);
    console.log(`💸 Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`🔄 Credits/Refunds: $${creditsRefunds.toFixed(2)}`);

    // Status breakdown
    console.log('\n6. Status breakdown:');
    const statusCounts = {};
    invoices.forEach(inv => {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} invoices`);
    });

    // Validate data integrity
    console.log('\n7. Data validation:');
    let issues = [];

    // Check for negative amounts
    const negativeAmounts = invoices.filter(inv => parseFloat(inv.amount) < 0);
    if (negativeAmounts.length > 0) {
      issues.push(`⚠️  Found ${negativeAmounts.length} invoices with negative amounts`);
      negativeAmounts.forEach(inv => {
        console.log(`   - ${inv.invoice_number}: $${inv.amount} (${inv.status})`);
      });
    }

    // Check for missing client names
    const missingClients = invoices.filter(inv => !inv.client_name);
    if (missingClients.length > 0) {
      issues.push(`❌ Found ${missingClients.length} invoices without client names`);
    }

    if (issues.length === 0) {
      console.log('✅ All data validation checks passed!');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(issue));
    }

    console.log('\n8. Expected Dashboard Values:');
    console.log('='.repeat(40));
    console.log('The dashboard should display:');
    console.log(`- Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`- Total Clients: ${clients.length}`);
    console.log(`- Total Invoices: ${invoices.length}`);
    console.log(`- Pending Invoices: ${pendingInvoices}`);
    console.log(`- Paid Invoices: ${paidInvoices}`);
    console.log(`- Overdue Invoices: ${overdueInvoices}`);
    console.log(`- Draft Invoices: ${draftInvoices}`);
    console.log(`- Total Expenses: $${totalExpenses.toFixed(2)}`);
    if (creditsRefunds > 0) {
      console.log(`- Credits/Refunds: $${creditsRefunds.toFixed(2)}`);
    }

    console.log('\n✅ Dashboard API test completed successfully!');
    console.log('\nPlease verify these numbers match what you see in the dashboard at:');
    console.log('http://localhost:4173');

  } catch (error) {
    console.error('❌ Dashboard API test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDashboardAPI();
