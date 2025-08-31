// SQLite-based database operations for Slimbooks application
import { sqliteService } from '@/services/sqlite.svc';
import { 
  User,
  Client,
  Invoice,
  Expense,
  InvoiceTemplate,
  Report,
  ValidationError
} from '@/types';

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
  bulkImport: async (expenses: any[]): Promise<{ imported: number; failed: number; errors: any[] }> => {
    await ensureInitialized();
    return await sqliteService.bulkImportExpenses(expenses);
  },
  bulkDelete: async (expenseIds: number[]): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.bulkDeleteExpenses(expenseIds);
  },
  bulkUpdateCategory: async (expenseIds: number[], category: string): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.bulkUpdateExpenseCategory(expenseIds, category);
  },
  bulkUpdateMerchant: async (expenseIds: number[], merchant: string): Promise<{ changes: number }> => {
    await ensureInitialized();
    return await sqliteService.bulkUpdateExpenseMerchant(expenseIds, merchant);
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
  generateProfitLossData: async (startDate: string, endDate: string, accountingMethod: 'cash' | 'accrual' = 'accrual', preset?: string, breakdownPeriod: 'monthly' | 'quarterly' = 'quarterly'): Promise<{
    revenue: {
      total: number;
      paid: number;
      pending: number;
      invoices: number;
      otherIncome: number;
    };
    expenses: Record<string, number> & { total: number };
    profit: {
      net: number;
      gross: number;
      margin: number;
    };
    netIncome: number;
    accountingMethod: 'cash' | 'accrual';
    invoices: (Invoice & { client_name: string })[];
    periodColumns: Array<{
      label: string;
      revenue: number;
      expenses: number;
      expensesByCategory: Record<string, number>;
      netIncome: number;
    }>;
    hasBreakdown: boolean;
    breakdownPeriod: 'monthly' | 'quarterly';
  }> => {
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

    // Function to generate period columns for any date range
    const generatePeriodColumns = () => {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const columns: any[] = [];

      // For yearly reports, use the existing quarterly/monthly logic
      if (preset === 'this-year' || preset === 'last-year') {
        const year = startDateObj.getFullYear();
        const periodsCount = breakdownPeriod === 'quarterly' ? 4 : 12;

        for (let i = 0; i < periodsCount; i++) {
          let periodStart: Date;
          let periodEnd: Date;
          let periodLabel: string;

          if (breakdownPeriod === 'quarterly') {
            periodStart = new Date(year, i * 3, 1);
            periodEnd = new Date(year, (i + 1) * 3, 0);
            periodLabel = `Q${i + 1}`;
          } else {
            periodStart = new Date(year, i, 1);
            periodEnd = new Date(year, i + 1, 0);
            periodLabel = periodStart.toLocaleDateString('en-US', { month: 'short' });
          }

          // Filter data for this period
          const periodInvoices = invoices.filter((invoice: any) => {
            const invoiceDate = new Date(invoice.created_at);
            return invoiceDate >= periodStart && invoiceDate <= periodEnd;
          });

          const periodExpenses = expenses.filter((expense: any) => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= periodStart && expenseDate <= periodEnd;
          });

          // Calculate revenue for this period
          const periodInvoiceRevenue = periodInvoices.reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
          const periodPaidRevenue = periodInvoices
            .filter((invoice: any) => invoice.status === 'paid')
            .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
          
          const periodRecognizedRevenue = accountingMethod === 'cash' ? periodPaidRevenue : periodInvoiceRevenue;

          // Calculate expenses by category for this period
          const periodExpensesByCategory = periodExpenses.reduce((acc: any, expense: any) => {
            const category = expense.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + toNumber(expense.amount);
            return acc;
          }, {});

          const periodTotalExpenses = periodExpenses.reduce((sum: number, expense: any) => sum + toNumber(expense.amount), 0);

          columns.push({
            label: periodLabel,
            revenue: periodRecognizedRevenue,
            expenses: periodTotalExpenses,
            expensesByCategory: periodExpensesByCategory,
            netIncome: periodRecognizedRevenue - periodTotalExpenses
          });
        }

        return { columns, hasBreakdown: true };
      }

      // For other date ranges, create period breakdown based on the date range span
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
      
      // Don't show breakdown for periods shorter than a month
      if (daysDiff < 30) {
        return { columns: [], hasBreakdown: false };
      }

      // For multi-month ranges, create monthly periods
      let currentPeriodStart = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
      const endPeriod = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1);

      while (currentPeriodStart <= endPeriod) {
        const currentPeriodEnd = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 0);
        const periodLabel = currentPeriodStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        // Ensure we don't go beyond the actual end date
        const actualPeriodStart = new Date(Math.max(currentPeriodStart.getTime(), startDateObj.getTime()));
        const actualPeriodEnd = new Date(Math.min(currentPeriodEnd.getTime(), endDateObj.getTime()));

        // Filter data for this period
        const periodInvoices = invoices.filter((invoice: any) => {
          const invoiceDate = new Date(invoice.created_at);
          return invoiceDate >= actualPeriodStart && invoiceDate <= actualPeriodEnd;
        });

        const periodExpenses = expenses.filter((expense: any) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= actualPeriodStart && expenseDate <= actualPeriodEnd;
        });

        // Calculate revenue for this period
        const periodInvoiceRevenue = periodInvoices.reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
        const periodPaidRevenue = periodInvoices
          .filter((invoice: any) => invoice.status === 'paid')
          .reduce((sum: number, invoice: any) => sum + toNumber(invoice.amount), 0);
        
        const periodRecognizedRevenue = accountingMethod === 'cash' ? periodPaidRevenue : periodInvoiceRevenue;

        // Calculate expenses by category for this period
        const periodExpensesByCategory = periodExpenses.reduce((acc: any, expense: any) => {
          const category = expense.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + toNumber(expense.amount);
          return acc;
        }, {});

        const periodTotalExpenses = periodExpenses.reduce((sum: number, expense: any) => sum + toNumber(expense.amount), 0);

        columns.push({
          label: periodLabel,
          revenue: periodRecognizedRevenue,
          expenses: periodTotalExpenses,
          expensesByCategory: periodExpensesByCategory,
          netIncome: periodRecognizedRevenue - periodTotalExpenses
        });

        // Move to next month
        currentPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 1);
      }

      return { columns, hasBreakdown: columns.length > 1 };
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

    const periodData = generatePeriodColumns();

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
      invoices,
      periodColumns: periodData.columns, // Add period column data
      hasBreakdown: periodData.hasBreakdown, // Flag to indicate if breakdown is available
      breakdownPeriod: breakdownPeriod // Track the breakdown period type
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
  generateClientData: async (startDate?: string, endDate?: string): Promise<{
    clients: (Client & {
      totalInvoices: number;
      totalRevenue: number;
      paidRevenue: number;
      pendingRevenue: number;
      overdueRevenue: number;
    })[];
    totalClients: number;
    totalRevenue: number;
    totalPaidRevenue: number;
    totalPendingRevenue: number;
    totalOverdueRevenue: number;
  }> => {
    await ensureInitialized();

    const clients = await sqliteService.getClients();

    // Get all invoices and filter by date range if provided
    const allInvoices = await sqliteService.getInvoices();
    let invoices = allInvoices;

    if (startDate && endDate) {
      invoices = allInvoices.filter((invoice: Invoice & { client_name: string }) => {
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

    const clientStats = clients.map((client: Client) => {
      const clientInvoices = invoices.filter((invoice: Invoice & { client_name: string }) => invoice.client_id === client.id);
      const totalRevenue = clientInvoices.reduce((sum: number, invoice: Invoice & { client_name: string }) => sum + toNumber(invoice.amount), 0);
      const paidRevenue = clientInvoices
        .filter((invoice: Invoice & { client_name: string }) => invoice.status === 'paid')
        .reduce((sum: number, invoice: Invoice & { client_name: string }) => sum + toNumber(invoice.amount), 0);
      const pendingRevenue = clientInvoices
        .filter((invoice: Invoice & { client_name: string }) => invoice.status !== 'paid')
        .reduce((sum: number, invoice: Invoice & { client_name: string }) => sum + toNumber(invoice.amount), 0);
      const overdueRevenue = clientInvoices
        .filter((invoice: Invoice & { client_name: string }) => invoice.status === 'overdue')
        .reduce((sum: number, invoice: Invoice & { client_name: string }) => sum + toNumber(invoice.amount), 0);

      return {
        ...client,
        totalInvoices: clientInvoices.length,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        overdueRevenue
      };
    }).filter(client => client.totalInvoices > 0); // Only include clients with invoices

    const totalRevenue = clientStats.reduce((sum: number, client) => sum + client.totalRevenue, 0);
    const totalPaidRevenue = clientStats.reduce((sum: number, client) => sum + client.paidRevenue, 0);
    const totalPendingRevenue = clientStats.reduce((sum: number, client) => sum + client.pendingRevenue, 0);
    const totalOverdueRevenue = clientStats.reduce((sum: number, client) => sum + client.overdueRevenue, 0);

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
  }
};
