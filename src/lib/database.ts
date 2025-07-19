// SQLite-based database operations for Slimbooks application
import { sqliteService } from './sqlite-service';
import { User } from '@/types/auth';

// Interfaces (keeping the same structure for compatibility)
interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  template_id?: number;
  amount: number;
  status: string;
  due_date: string;
  description: string;
  stripe_invoice_id?: string;
  type: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  line_items?: string;
  tax_amount?: number;
  tax_rate_id?: string;
  shipping_amount?: number;
  shipping_rate_id?: string;
  notes?: string;
  email_status?: string;
  email_sent_at?: string;
  email_error?: string;
  last_email_attempt?: string;
}

interface InvoiceTemplate {
  id: number;
  name: string;
  client_id: number;
  frequency: string;
  amount: number;
  description: string;
  next_invoice_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  line_items?: string;
  tax_amount?: number;
  tax_rate_id?: string;
  shipping_amount?: number;
  shipping_rate_id?: string;
  notes?: string;
  payment_terms?: string;
}

interface Expense {
  id: number;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  description: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'reimbursed';
  created_at: string;
  updated_at: string;
}

interface Report {
  id: number;
  name: string;
  type: 'profit-loss' | 'expense' | 'invoice' | 'client';
  date_range_start: string;
  date_range_end: string;
  data: any;
  created_at: string;
}

// Initialize database
let initializationPromise: Promise<void> | null = null;

const ensureInitialized = async (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }
    })();
  }
  return initializationPromise;
};

// Initialize database with sample data (SQLite version)
export const initDatabase = async () => {
  await ensureInitialized();
  
  // Check if data already exists
  const existingClients = await sqliteService.all('SELECT COUNT(*) as count FROM clients');
  if (existingClients[0]?.count > 0) {
    return; // Already initialized
  }

  // Sample data will be inserted here if needed
};

// Client operations
export const clientOperations = {
  getAll: async (): Promise<Client[]> => {
    await ensureInitialized();
    return await sqliteService.all('SELECT * FROM clients ORDER BY created_at DESC');
  },

  getById: async (id: number): Promise<Client | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get('SELECT * FROM clients WHERE id = ?', [id]);
    return result || undefined;
  },
  
  create: async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    try {
      await ensureInitialized();
      const id = await sqliteService.getNextId('clients');
      const now = new Date().toISOString();

      await sqliteService.run(`
        INSERT INTO clients (id, name, email, phone, company, address, city, state, zipCode, country, stripe_customer_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
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
      ]);

      return { lastInsertRowid: id };
    } catch (error) {
      console.error('Error creating client:', error);
      throw new Error('Failed to create client');
    }
  },
  
  update: async (id: number, clientData: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    try {
      await ensureInitialized();

      const fields = Object.keys(clientData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(clientData), id];

      await sqliteService.run(`UPDATE clients SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values);
      return { changes: 1 };
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('Failed to update client');
    }
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    try {
      await ensureInitialized();
      await sqliteService.run('DELETE FROM clients WHERE id = ?', [id]);
      return { changes: 1 };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new Error('Failed to delete client');
    }
  }
};

// Invoice operations
export const invoiceOperations = {
  getAll: async (): Promise<(Invoice & { client_name: string; client_email?: string; client_phone?: string; client_address?: string })[]> => {
    await ensureInitialized();
    return await sqliteService.all(`
      SELECT
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        (c.address || ', ' || c.city || ', ' || c.state || ' ' || c.zipCode) as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
    `);
  },
  
  getById: async (id: number): Promise<(Invoice & { client_name: string; client_email?: string; client_phone?: string; client_address?: string }) | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get(`
      SELECT 
        i.*,
        c.name as client_name,
        COALESCE(i.client_email, c.email) as client_email,
        COALESCE(i.client_phone, c.phone) as client_phone,
        COALESCE(i.client_address, c.address || ', ' || c.city || ', ' || c.state || ' ' || c.zipCode) as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `, [id]);
    return result || undefined;
  },
  
  create: async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    const id = await sqliteService.getNextId('invoices');
    const now = new Date().toISOString();

    await sqliteService.run(`
      INSERT INTO invoices (id, invoice_number, client_id, template_id, amount, status, due_date, description,
                           stripe_invoice_id, type, client_name, client_email, client_phone, client_address,
                           line_items, tax_amount, tax_rate_id, shipping_amount, shipping_rate_id, notes,
                           email_status, email_sent_at, email_error, last_email_attempt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      invoiceData.invoice_number,
      invoiceData.client_id,
      invoiceData.template_id || null,
      invoiceData.amount,
      invoiceData.status,
      invoiceData.due_date,
      invoiceData.description || '',
      invoiceData.stripe_invoice_id || null,
      invoiceData.type || 'one-time',
      invoiceData.client_name || '',
      invoiceData.client_email || '',
      invoiceData.client_phone || '',
      invoiceData.client_address || '',
      invoiceData.line_items || null,
      invoiceData.tax_amount || 0,
      invoiceData.tax_rate_id || null,
      invoiceData.shipping_amount || 0,
      invoiceData.shipping_rate_id || null,
      invoiceData.notes || '',
      invoiceData.email_status || 'not_sent',
      invoiceData.email_sent_at || null,
      invoiceData.email_error || null,
      invoiceData.last_email_attempt || null,
      now,
      now
    ]);
    
    return { lastInsertRowid: id };
  },
  
  update: async (id: number, invoiceData: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    await ensureInitialized();
    
    const fields = Object.keys(invoiceData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(invoiceData);
    values.push(id);
    
    await sqliteService.run(`UPDATE invoices SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values);
    return { changes: 1 };
  },
  
  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    await sqliteService.run('DELETE FROM invoices WHERE id = ?', [id]);
    return { changes: 1 };
  }
};

// Template operations
export const templateOperations = {
  getAll: async (): Promise<(InvoiceTemplate & { client_name: string })[]> => {
    await ensureInitialized();
    return await sqliteService.all(`
      SELECT
        t.*,
        c.name as client_name
      FROM templates t
      LEFT JOIN clients c ON t.client_id = c.id
      ORDER BY t.created_at DESC
    `);
  },

  getById: async (id: number): Promise<(InvoiceTemplate & { client_name: string }) | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get(`
      SELECT
        t.*,
        c.name as client_name
      FROM templates t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = ?
    `, [id]);
    return result || undefined;
  },

  create: async (templateData: Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    const id = await sqliteService.getNextId('templates');
    const now = new Date().toISOString();

    await sqliteService.run(`
      INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                            next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                            shipping_amount, shipping_rate_id, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
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
    ]);

    return { lastInsertRowid: id };
  },

  update: async (id: number, templateData: Partial<Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    await ensureInitialized();

    const fields = Object.keys(templateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(templateData), id];

    await sqliteService.run(`UPDATE templates SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values);
    return { changes: 1 };
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    await sqliteService.run('DELETE FROM templates WHERE id = ?', [id]);
    return { changes: 1 };
  }
};

// Expense operations
export const expenseOperations = {
  getAll: async (): Promise<Expense[]> => {
    await ensureInitialized();
    return await sqliteService.all('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
  },

  getById: async (id: number): Promise<Expense | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get('SELECT * FROM expenses WHERE id = ?', [id]);
    return result || undefined;
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<Expense[]> => {
    await ensureInitialized();
    return await sqliteService.all(`
      SELECT * FROM expenses
      WHERE date(date) >= date(?) AND date(date) <= date(?)
      ORDER BY date DESC, created_at DESC
    `, [startDate, endDate]);
  },

  create: async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    try {
      await ensureInitialized();
      const id = await sqliteService.getNextId('expenses');
      const now = new Date().toISOString();

      await sqliteService.run(`
        INSERT INTO expenses (id, date, merchant, category, amount, description, receipt_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        expenseData.date,
        expenseData.merchant,
        expenseData.category,
        expenseData.amount,
        expenseData.description,
        expenseData.receipt_url || null,
        expenseData.status,
        now,
        now
      ]);

      return { lastInsertRowid: id };
    } catch (error) {
      console.error('Error creating expense:', error);
      throw new Error('Failed to create expense');
    }
  },

  update: async (id: number, expenseData: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    try {
      await ensureInitialized();

      const fields = Object.keys(expenseData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(expenseData);
      values.push(id);

      await sqliteService.run(`UPDATE expenses SET ${fields}, updated_at = datetime('now') WHERE id = ?`, values);
      return { changes: 1 };
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    try {
      await ensureInitialized();
      await sqliteService.run('DELETE FROM expenses WHERE id = ?', [id]);
      return { changes: 1 };
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }
};

// Report operations
export const reportOperations = {
  getAll: async (): Promise<Report[]> => {
    await ensureInitialized();
    return await sqliteService.all('SELECT * FROM reports ORDER BY created_at DESC');
  },

  getById: async (id: number): Promise<Report | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get('SELECT * FROM reports WHERE id = ?', [id]);
    if (result && result.data) {
      try {
        result.data = JSON.parse(result.data);
      } catch (e) {
        console.warn('Failed to parse report data:', e);
      }
    }
    return result || undefined;
  },

  create: async (reportData: Omit<Report, 'id' | 'created_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    const id = await sqliteService.getNextId('reports');
    const now = new Date().toISOString();

    await sqliteService.run(`
      INSERT INTO reports (id, name, type, date_range_start, date_range_end, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      reportData.name,
      reportData.type,
      reportData.date_range_start,
      reportData.date_range_end,
      JSON.stringify(reportData.data || {}),
      now
    ]);

    return { lastInsertRowid: id };
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    await sqliteService.run('DELETE FROM reports WHERE id = ?', [id]);
    return { changes: 1 };
  },

  // Generate Profit & Loss Report Data
  generateProfitLossData: async (startDate: string, endDate: string, accountingMethod: 'cash' | 'accrual' = 'accrual'): Promise<any> => {
    await ensureInitialized();

    // Get invoices in date range
    const invoices = await sqliteService.all(`
      SELECT * FROM invoices
      WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
    `, [startDate, endDate]);

    // Get expenses in date range
    const expenses = await sqliteService.all(`
      SELECT * FROM expenses
      WHERE date(date) >= date(?) AND date(date) <= date(?)
    `, [startDate, endDate]);

    // Helper function to safely convert to number
    const toNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? 0 : num;
    };

    // Calculate revenue with proper type conversion
    const totalInvoiceRevenue = invoices.reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
    const paidRevenue = invoices
      .filter((invoice: any) => invoice.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
    const pendingRevenue = invoices
      .filter((invoice: any) => invoice.status !== 'paid') // All non-paid invoices
      .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);

    // Choose revenue recognition method based on accounting method
    const recognizedRevenue = accountingMethod === 'cash' ? paidRevenue : totalInvoiceRevenue;
    const otherIncome = 0; // Placeholder for future other income sources
    const totalRevenue = recognizedRevenue + otherIncome;

    // Calculate expenses with proper type conversion
    const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + toNumber(expense.amount), 0);
    const expensesByCategory = expenses.reduce((acc: any, expense: any) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + toNumber(expense.amount);
      return acc;
    }, {});

    // Calculate profit/loss based on recognized revenue
    const netProfit = recognizedRevenue - totalExpenses;
    const grossProfit = totalRevenue - totalExpenses;

    return {
      revenue: {
        total: totalRevenue,
        paid: paidRevenue,
        pending: pendingRevenue,
        invoices: recognizedRevenue, // Invoice revenue based on accounting method
        otherIncome: otherIncome // Other income
      },
      expenses: {
        total: totalExpenses,
        ...expensesByCategory // Spread category expenses directly
      },
      profit: {
        net: netProfit,
        gross: grossProfit,
        margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
      },
      netIncome: netProfit, // Add netIncome at root level for component compatibility
      accountingMethod: accountingMethod, // Track which method was used
      invoices
    };
  },

  // Generate Expense Report Data
  generateExpenseData: async (startDate: string, endDate: string): Promise<any> => {
    await ensureInitialized();

    const expenses = await sqliteService.all(`
      SELECT * FROM expenses
      WHERE date(date) >= date(?) AND date(date) <= date(?)
      ORDER BY date DESC
    `, [startDate, endDate]);

    // Helper function to safely convert to number
    const toNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? 0 : num;
    };

    const expensesByCategory = expenses.reduce((acc: any, expense: any) => {
      const category = expense.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + toNumber(expense.amount);
      return acc;
    }, {});

    const expensesByStatus = expenses.reduce((acc: any, expense: any) => {
      const status = expense.status || 'pending';
      acc[status] = (acc[status] || 0) + toNumber(expense.amount);
      return acc;
    }, {});

    const totalAmount = expenses.reduce((sum: number, expense: any) => sum + toNumber(expense.amount), 0);

    return {
      expenses,
      expensesByCategory,
      expensesByStatus,
      totalAmount,
      totalCount: expenses.length
    };
  },

  // Generate Invoice Report Data
  generateInvoiceData: async (startDate: string, endDate: string): Promise<any> => {
    await ensureInitialized();

    const invoices = await sqliteService.all(`
      SELECT
        i.*,
        c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE date(i.created_at) >= date(?) AND date(i.created_at) <= date(?)
      ORDER BY i.created_at DESC
    `, [startDate, endDate]);

    // Helper function to safely convert to number
    const toNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? 0 : num;
    };

    const invoicesByStatus = invoices.reduce((acc: any, invoice: any) => {
      const status = invoice.status || 'draft';
      acc[status] = (acc[status] || 0) + toNumber(invoice.amount);
      return acc;
    }, {});

    const invoicesByClient = invoices.reduce((acc: any, invoice: any) => {
      const clientName = invoice.client_name || 'Unknown Client';
      acc[clientName] = (acc[clientName] || 0) + toNumber(invoice.amount);
      return acc;
    }, {});

    const totalAmount = invoices.reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
    const paidAmount = invoices
      .filter((invoice: any) => invoice.status === 'paid')
      .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
    const pendingAmount = invoices
      .filter((invoice: any) => invoice.status !== 'paid') // All non-paid invoices are pending
      .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
    const overdueAmount = invoices
      .filter((invoice: any) => invoice.status === 'overdue')
      .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);

    return {
      invoices,
      invoicesByStatus,
      invoicesByClient,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalCount: invoices.length
    };
  },

  // Generate Client Report Data
  generateClientData: async (startDate?: string, endDate?: string): Promise<any> => {
    await ensureInitialized();

    const clients = await sqliteService.all('SELECT * FROM clients ORDER BY created_at DESC');

    // Build invoice query with optional date filtering
    let invoiceQuery = `
      SELECT
        i.*,
        c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
    `;
    const queryParams: string[] = [];

    if (startDate && endDate) {
      invoiceQuery += ' WHERE date(i.created_at) >= date(?) AND date(i.created_at) <= date(?)';
      queryParams.push(startDate, endDate);
    }

    const invoices = await sqliteService.all(invoiceQuery, queryParams);

    // Helper function to safely convert to number
    const toNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return isNaN(num) ? 0 : num;
    };

    const clientStats = clients.map((client: any) => {
      const clientInvoices = invoices.filter((invoice: any) => invoice.client_id === client.id);
      const totalRevenue = clientInvoices.reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
      const paidRevenue = clientInvoices
        .filter((invoice: any) => invoice.status === 'paid')
        .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
      const pendingRevenue = clientInvoices
        .filter((invoice: any) => invoice.status !== 'paid')
        .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
      const overdueRevenue = clientInvoices
        .filter((invoice: any) => invoice.status === 'overdue')
        .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);

      return {
        ...client,
        totalInvoices: clientInvoices.length,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue
      };
    }).filter(client => client.totalInvoices > 0); // Only include clients with invoices

    const totalRevenue = clientStats.reduce((sum: number, client: any) => sum + client.totalRevenue, 0);
    const totalPaidRevenue = clientStats.reduce((sum: number, client: any) => sum + client.paidRevenue, 0);
    const totalPendingRevenue = clientStats.reduce((sum: number, client: any) => sum + client.pendingRevenue, 0);
    const totalOverdueRevenue = clientStats.reduce((sum: number, client: any) => sum + client.overdueRevenue, 0);

    return {
      clients: clientStats,
      totalClients: clientStats.length,
      totalRevenue,
      totalPaidRevenue,
      totalPendingRevenue,
      totalOverdueRevenue
    };
  }
};

// User operations
export const userOperations = {
  getAll: async (): Promise<User[]> => {
    await ensureInitialized();
    return await sqliteService.all('SELECT * FROM users ORDER BY created_at DESC');
  },

  getById: async (id: number): Promise<User | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get('SELECT * FROM users WHERE id = ?', [id]);
    return result || undefined;
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get('SELECT * FROM users WHERE email = ?', [email]);
    return result || undefined;
  },

  getByGoogleId: async (googleId: string): Promise<User | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.get('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return result || undefined;
  },

  create: async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    const id = await sqliteService.getNextId('users');
    const now = new Date().toISOString();

    await sqliteService.run(`
      INSERT INTO users (
        id, name, email, username, password_hash, role, email_verified,
        google_id, two_factor_enabled, two_factor_secret, backup_codes,
        last_login, failed_login_attempts, account_locked_until, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
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
    ]);

    return { lastInsertRowid: id };
  },

  update: async (id: number, userData: Partial<User>): Promise<{ changes: number }> => {
    await ensureInitialized();
    const fields = Object.keys(userData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(userData), id];

    await sqliteService.run(`UPDATE users SET ${fields} WHERE id = ?`, values);
    return { changes: 1 };
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    await sqliteService.run('DELETE FROM users WHERE id = ?', [id]);
    return { changes: 1 };
  },

  updateLoginAttempts: async (id: number, attempts: number, lockedUntil?: string): Promise<void> => {
    await ensureInitialized();
    await sqliteService.run(
      'UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?',
      [attempts, lockedUntil || null, id]
    );
  },

  updateLastLogin: async (id: number): Promise<void> => {
    await ensureInitialized();
    const now = new Date().toISOString();
    await sqliteService.run('UPDATE users SET last_login = ? WHERE id = ?', [now, id]);
  },

  verifyEmail: async (id: number): Promise<void> => {
    await ensureInitialized();
    await sqliteService.run('UPDATE users SET email_verified = 1 WHERE id = ?', [id]);
  },

  enable2FA: async (id: number, secret: string, backupCodes: string[]): Promise<void> => {
    await ensureInitialized();
    await sqliteService.run(
      'UPDATE users SET two_factor_enabled = 1, two_factor_secret = ?, backup_codes = ? WHERE id = ?',
      [secret, JSON.stringify(backupCodes), id]
    );
  },

  disable2FA: async (id: number): Promise<void> => {
    await ensureInitialized();
    await sqliteService.run(
      'UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL, backup_codes = NULL WHERE id = ?',
      [id]
    );
  }
};
