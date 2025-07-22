// SQLite-based database operations for Slimbooks application
import { sqliteService } from '@/services/sqlite.svc';
import { User } from '@/types/auth';

// Interfaces (keeping the same structure for compatibility)
interface Client {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
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
  tax_amount?: number;
  total_amount: number;
  status: string;
  due_date: string;
  issue_date?: string;
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
  amount: number;
  description?: string;
  frequency: string;
  payment_terms: string;
  next_invoice_date: string;
  is_active: number; // SQLite uses INTEGER for boolean
  line_items?: string;
  tax_amount?: number;
  tax_rate_id?: string;
  shipping_amount?: number;
  shipping_rate_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  const existingClients = await sqliteService.getClients();
  if (existingClients.length > 0) {
    return; // Already initialized
  }

  // Sample data will be inserted here if needed
};

// Client operations
export const clientOperations = {
  getAll: async (): Promise<Client[]> => {
    await ensureInitialized();
    return await sqliteService.getClients();
  },

  getById: async (id: number): Promise<Client | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getClientById(id);
    return result || undefined;
  },
  
  create: async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    try {
      await ensureInitialized();
      return await sqliteService.createClient(clientData);
    } catch (error) {
      console.error('Error creating client:', error);
      throw new Error('Failed to create client');
    }
  },
  
  update: async (id: number, clientData: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    try {
      await ensureInitialized();
      return await sqliteService.updateClient(id, clientData);
    } catch (error) {
      console.error('Error updating client:', error);
      throw new Error('Failed to update client');
    }
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.deleteClient(id);
  }
};

// Invoice operations
export const invoiceOperations = {
  getAll: async (): Promise<(Invoice & { client_name: string; client_email?: string; client_phone?: string; client_address?: string })[]> => {
    await ensureInitialized();
    return await sqliteService.getInvoices();
  },

  getById: async (id: number): Promise<(Invoice & { client_name: string; client_email?: string; client_phone?: string; client_address?: string }) | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getInvoiceById(id);
    return result || undefined;
  },
  
  create: async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    return await sqliteService.createInvoice(invoiceData);
  },

  update: async (id: number, invoiceData: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.updateInvoice(id, invoiceData);
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.deleteInvoice(id);
  }
};

// Template operations
export const templateOperations = {
  getAll: async (): Promise<(InvoiceTemplate & { client_name: string })[]> => {
    await ensureInitialized();
    return await sqliteService.getTemplates();
  },

  getById: async (id: number): Promise<(InvoiceTemplate & { client_name: string }) | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getTemplateById(id);
    return result || undefined;
  },

  create: async (templateData: Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    return await sqliteService.createTemplate(templateData);
  },

  update: async (id: number, templateData: Partial<Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.updateTemplate(id, templateData);
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.deleteTemplate(id);
  }
};

// Expense operations
export const expenseOperations = {
  getAll: async (): Promise<Expense[]> => {
    await ensureInitialized();
    return await sqliteService.getExpenses();
  },

  getById: async (id: number): Promise<Expense | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getExpenseById(id);
    return result || undefined;
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<Expense[]> => {
    await ensureInitialized();
    return await sqliteService.getExpenses(startDate, endDate);
  },

  create: async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    return await sqliteService.createExpense(expenseData);
  },

  update: async (id: number, expenseData: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.updateExpense(id, expenseData);
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.deleteExpense(id);
  }
};

// Report operations
export const reportOperations = {
  getAll: async (): Promise<Report[]> => {
    await ensureInitialized();
    return await sqliteService.getReports();
  },

  getById: async (id: number): Promise<Report | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getReportById(id);
    return result || undefined;
  },

  create: async (reportData: Omit<Report, 'id' | 'created_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    return await sqliteService.createReport(reportData);
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.deleteReport(id);
  },

  // Generate Profit & Loss Report Data
  generateProfitLossData: async (startDate: string, endDate: string, accountingMethod: 'cash' | 'accrual' = 'accrual'): Promise<any> => {
    await ensureInitialized();

    // Get all invoices and filter by date range
    const allInvoices = await sqliteService.getInvoices();
    const invoices = allInvoices.filter((invoice: any) => {
      const invoiceDate = new Date(invoice.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return invoiceDate >= start && invoiceDate <= end;
    });

    // Get expenses in date range using the API
    const expenses = await sqliteService.getExpenses(startDate, endDate);

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

    const expenses = await sqliteService.getExpenses(startDate, endDate);

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

    // Get all invoices and filter by date range
    const allInvoices = await sqliteService.getInvoices();
    const invoices = allInvoices.filter((invoice: any) => {
      const invoiceDate = new Date(invoice.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return invoiceDate >= start && invoiceDate <= end;
    });

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

    const clients = await sqliteService.getClients();

    // Get all invoices and filter by date range if provided
    const allInvoices = await sqliteService.getInvoices();
    let invoices = allInvoices;

    if (startDate && endDate) {
      invoices = allInvoices.filter((invoice: any) => {
        const invoiceDate = new Date(invoice.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return invoiceDate >= start && invoiceDate <= end;
      });
    }

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
    return await sqliteService.getUsers();
  },

  getById: async (id: number): Promise<User | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getUserById(id);
    return result || undefined;
  },

  getByEmail: async (email: string): Promise<User | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getUserByEmail(email);
    return result || undefined;
  },

  getByGoogleId: async (googleId: string): Promise<User | undefined> => {
    await ensureInitialized();
    const result = await sqliteService.getUserByGoogleId(googleId);
    return result || undefined;
  },

  create: async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> => {
    await ensureInitialized();
    return await sqliteService.createUser(userData);
  },

  update: async (id: number, userData: Partial<User>): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.updateUser(id, userData);
  },

  delete: async (id: number): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.deleteUser(id);
  },

  updateLoginAttempts: async (id: number, attempts: number, lockedUntil?: string): Promise<void> => {
    await ensureInitialized();
    await sqliteService.updateUserLoginAttempts(id, attempts, lockedUntil);
  },

  updateLastLogin: async (id: number): Promise<void> => {
    await ensureInitialized();
    await sqliteService.updateUserLastLogin(id);
  },

  verifyEmail: async (id: number): Promise<void> => {
    await ensureInitialized();
    await sqliteService.verifyUserEmail(id);
  },

  enable2FA: async (id: number, secret: string, backupCodes: string[]): Promise<void> => {
    await ensureInitialized();
    await sqliteService.enableUser2FA(id, secret, backupCodes);
  },

  disable2FA: async (id: number): Promise<void> => {
    await ensureInitialized();
    await sqliteService.disableUser2FA(id);
  }
};
