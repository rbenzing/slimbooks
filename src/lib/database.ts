// Browser-compatible database simulation using localStorage

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
  shipping_amount?: number;
  notes?: string;
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
  shipping_amount?: number;
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

// Storage keys
const CLIENTS_KEY = 'clientbill_clients';
const INVOICES_KEY = 'clientbill_invoices';
const TEMPLATES_KEY = 'clientbill_templates';
const EXPENSES_KEY = 'clientbill_expenses';
const REPORTS_KEY = 'clientbill_reports';
const COUNTERS_KEY = 'clientbill_counters';

// Helper functions for localStorage
const getStorageData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setStorageData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getNextId = (entity: string): number => {
  const counters = JSON.parse(localStorage.getItem(COUNTERS_KEY) || '{}');
  const nextId = (counters[entity] || 0) + 1;
  counters[entity] = nextId;
  localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
  return nextId;
};

// Initialize database with sample data
export const initDatabase = () => {
  // Check if data already exists
  if (localStorage.getItem(CLIENTS_KEY)) {
    return; // Already initialized
  }

  // Sample clients
  const sampleClients: Client[] = [
    {
      id: 1,
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1-555-0123',
      company: 'Acme Corp',
      address: '123 Business St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'TechStart Inc',
      email: 'hello@techstart.com',
      phone: '+1-555-0124',
      company: 'TechStart',
      address: '456 Innovation Ave',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
      created_at: '2024-02-01T10:00:00Z',
      updated_at: '2024-02-01T10:00:00Z'
    },
    {
      id: 3,
      name: 'Design Studio LLC',
      email: 'info@designstudio.com',
      phone: '+1-555-0125',
      company: 'Design Studio',
      address: '789 Creative Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'USA',
      created_at: '2024-02-15T10:00:00Z',
      updated_at: '2024-02-15T10:00:00Z'
    }
  ];

  // Sample invoices
  const sampleInvoices: Invoice[] = [
    {
      id: 1,
      invoice_number: 'INV-001',
      client_id: 1,
      amount: 5000,
      status: 'paid',
      due_date: '2024-02-15',
      description: 'Web development services',
      type: 'invoice',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-02-10T10:00:00Z'
    },
    {
      id: 2,
      invoice_number: 'INV-002',
      client_id: 2,
      amount: 3500,
      status: 'sent',
      due_date: '2024-03-01',
      description: 'Mobile app development',
      type: 'invoice',
      created_at: '2024-02-01T10:00:00Z',
      updated_at: '2024-02-01T10:00:00Z'
    },
    {
      id: 3,
      invoice_number: 'INV-003',
      client_id: 3,
      amount: 2500,
      status: 'paid',
      due_date: '2024-03-15',
      description: 'Logo design and branding',
      type: 'invoice',
      created_at: '2024-02-15T10:00:00Z',
      updated_at: '2024-03-10T10:00:00Z'
    },
    {
      id: 4,
      invoice_number: 'INV-004',
      client_id: 1,
      amount: 7500,
      status: 'draft',
      due_date: '2024-04-01',
      description: 'E-commerce platform development',
      type: 'invoice',
      created_at: '2024-03-01T10:00:00Z',
      updated_at: '2024-03-01T10:00:00Z'
    }
  ];

  // Sample expenses
  const sampleExpenses: Expense[] = [
    {
      id: 1,
      date: '2024-01-10',
      merchant: 'Office Depot',
      category: 'Office Supplies',
      amount: 125.50,
      description: 'Printer paper and ink cartridges',
      status: 'approved',
      created_at: '2024-01-10T14:30:00Z',
      updated_at: '2024-01-12T10:00:00Z'
    },
    {
      id: 2,
      date: '2024-01-14',
      merchant: 'Starbucks',
      category: 'Meals & Entertainment',
      amount: 45.75,
      description: 'Client meeting coffee',
      status: 'reimbursed',
      created_at: '2024-01-14T16:20:00Z',
      updated_at: '2024-01-20T09:00:00Z'
    },
    {
      id: 3,
      date: '2024-02-03',
      merchant: 'Adobe',
      category: 'Software',
      amount: 299.99,
      description: 'Creative Cloud subscription',
      status: 'approved',
      created_at: '2024-02-03T09:15:00Z',
      updated_at: '2024-02-05T11:30:00Z'
    },
    {
      id: 4,
      date: '2024-02-12',
      merchant: 'United Airlines',
      category: 'Travel',
      amount: 650.00,
      description: 'Flight to client meeting',
      status: 'pending',
      created_at: '2024-02-12T18:45:00Z',
      updated_at: '2024-02-12T18:45:00Z'
    },
    {
      id: 5,
      date: '2024-02-18',
      merchant: 'AWS',
      category: 'Software',
      amount: 125.80,
      description: 'Cloud hosting services',
      status: 'approved',
      created_at: '2024-02-18T12:00:00Z',
      updated_at: '2024-02-20T14:15:00Z'
    },
    {
      id: 6,
      date: '2024-03-05',
      merchant: 'Google Ads',
      category: 'Marketing',
      amount: 500.00,
      description: 'Online advertising campaign',
      status: 'approved',
      created_at: '2024-03-05T10:30:00Z',
      updated_at: '2024-03-07T09:20:00Z'
    }
  ];

  setStorageData(CLIENTS_KEY, sampleClients);
  setStorageData(INVOICES_KEY, sampleInvoices);
  setStorageData(TEMPLATES_KEY, []);
  setStorageData(EXPENSES_KEY, sampleExpenses);
  setStorageData(REPORTS_KEY, []);
  localStorage.setItem(COUNTERS_KEY, JSON.stringify({ 
    clients: 3, 
    invoices: 4, 
    templates: 0, 
    expenses: 6, 
    reports: 0 
  }));
};

// Client operations
export const clientOperations = {
  getAll: (): Client[] => {
    return getStorageData<Client>(CLIENTS_KEY).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
  
  getById: (id: number): Client | undefined => {
    const clients = getStorageData<Client>(CLIENTS_KEY);
    return clients.find(client => client.id === id);
  },
  
  create: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): { lastInsertRowid: number } => {
    const clients = getStorageData<Client>(CLIENTS_KEY);
    const id = getNextId('clients');
    const now = new Date().toISOString();
    
    const newClient: Client = {
      ...clientData,
      id,
      created_at: now,
      updated_at: now
    };
    
    clients.push(newClient);
    setStorageData(CLIENTS_KEY, clients);
    
    return { lastInsertRowid: id };
  },
  
  update: (id: number, clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): { changes: number } => {
    const clients = getStorageData<Client>(CLIENTS_KEY);
    const index = clients.findIndex(client => client.id === id);
    
    if (index === -1) {
      return { changes: 0 };
    }
    
    clients[index] = {
      ...clients[index],
      ...clientData,
      updated_at: new Date().toISOString()
    };
    
    setStorageData(CLIENTS_KEY, clients);
    return { changes: 1 };
  },
  
  delete: (id: number): { changes: number } => {
    const clients = getStorageData<Client>(CLIENTS_KEY);
    const filteredClients = clients.filter(client => client.id !== id);
    
    if (filteredClients.length === clients.length) {
      return { changes: 0 };
    }
    
    setStorageData(CLIENTS_KEY, filteredClients);
    return { changes: 1 };
  }
};

// Invoice operations
export const invoiceOperations = {
  getAll: (): (Invoice & { client_name: string })[] => {
    const invoices = getStorageData<Invoice>(INVOICES_KEY);
    const clients = getStorageData<Client>(CLIENTS_KEY);
    
    return invoices.map(invoice => {
      const client = clients.find(c => c.id === invoice.client_id);
      return {
        ...invoice,
        client_name: client?.name || 'Unknown Client'
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  
  getById: (id: number): (Invoice & { client_name: string }) | undefined => {
    const invoices = getStorageData<Invoice>(INVOICES_KEY);
    const clients = getStorageData<Client>(CLIENTS_KEY);
    const invoice = invoices.find(inv => inv.id === id);
    
    if (!invoice) return undefined;
    
    const client = clients.find(c => c.id === invoice.client_id);
    return {
      ...invoice,
      client_name: client?.name || 'Unknown Client'
    };
  },
  
  create: (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): { lastInsertRowid: number } => {
    const invoices = getStorageData<Invoice>(INVOICES_KEY);
    const id = getNextId('invoices');
    const now = new Date().toISOString();
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id,
      created_at: now,
      updated_at: now
    };
    
    invoices.push(newInvoice);
    setStorageData(INVOICES_KEY, invoices);
    
    return { lastInsertRowid: id };
  },
  
  update: (id: number, invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): { changes: number } => {
    const invoices = getStorageData<Invoice>(INVOICES_KEY);
    const index = invoices.findIndex(invoice => invoice.id === id);
    
    if (index === -1) {
      return { changes: 0 };
    }
    
    invoices[index] = {
      ...invoices[index],
      ...invoiceData,
      updated_at: new Date().toISOString()
    };
    
    setStorageData(INVOICES_KEY, invoices);
    return { changes: 1 };
  },
  
  delete: (id: number): { changes: number } => {
    const invoices = getStorageData<Invoice>(INVOICES_KEY);
    const filteredInvoices = invoices.filter(invoice => invoice.id !== id);
    
    if (filteredInvoices.length === invoices.length) {
      return { changes: 0 };
    }
    
    setStorageData(INVOICES_KEY, filteredInvoices);
    return { changes: 1 };
  }
};

// Template operations
export const templateOperations = {
  getAll: (): (InvoiceTemplate & { client_name: string })[] => {
    const templates = getStorageData<InvoiceTemplate>(TEMPLATES_KEY);
    const clients = getStorageData<Client>(CLIENTS_KEY);
    
    return templates
      .filter(template => template.is_active)
      .map(template => {
        const client = clients.find(c => c.id === template.client_id);
        return {
          ...template,
          client_name: client?.name || 'Unknown Client'
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  
  getById: (id: number): (InvoiceTemplate & { client_name: string }) | undefined => {
    const templates = getStorageData<InvoiceTemplate>(TEMPLATES_KEY);
    const clients = getStorageData<Client>(CLIENTS_KEY);
    const template = templates.find(t => t.id === id);
    
    if (!template) return undefined;
    
    const client = clients.find(c => c.id === template.client_id);
    return {
      ...template,
      client_name: client?.name || 'Unknown Client'
    };
  },
  
  create: (templateData: Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at' | 'is_active'>): { lastInsertRowid: number } => {
    const templates = getStorageData<InvoiceTemplate>(TEMPLATES_KEY);
    const id = getNextId('templates');
    const now = new Date().toISOString();
    
    const newTemplate: InvoiceTemplate = {
      ...templateData,
      id,
      is_active: true,
      created_at: now,
      updated_at: now
    };
    
    templates.push(newTemplate);
    setStorageData(TEMPLATES_KEY, templates);
    
    return { lastInsertRowid: id };
  },
  
  update: (id: number, templateData: Partial<Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at' | 'is_active'>>): { changes: number } => {
    const templates = getStorageData<InvoiceTemplate>(TEMPLATES_KEY);
    const index = templates.findIndex(template => template.id === id);
    
    if (index === -1) {
      return { changes: 0 };
    }
    
    templates[index] = {
      ...templates[index],
      ...templateData,
      updated_at: new Date().toISOString()
    };
    
    setStorageData(TEMPLATES_KEY, templates);
    return { changes: 1 };
  },
  
  delete: (id: number): { changes: number } => {
    const templates = getStorageData<InvoiceTemplate>(TEMPLATES_KEY);
    const index = templates.findIndex(template => template.id === id);
    
    if (index === -1) {
      return { changes: 0 };
    }
    
    templates[index] = {
      ...templates[index],
      is_active: false,
      updated_at: new Date().toISOString()
    };
    
    setStorageData(TEMPLATES_KEY, templates);
    return { changes: 1 };
  }
};

// Expense operations
export const expenseOperations = {
  getAll: (): Expense[] => {
    return getStorageData<Expense>(EXPENSES_KEY).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getById: (id: number): Expense | undefined => {
    const expenses = getStorageData<Expense>(EXPENSES_KEY);
    return expenses.find(expense => expense.id === id);
  },

  getByDateRange: (startDate: string, endDate: string): Expense[] => {
    const expenses = getStorageData<Expense>(EXPENSES_KEY);
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return expenseDate >= start && expenseDate <= end;
    });
  },

  create: (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): { lastInsertRowid: number } => {
    const expenses = getStorageData<Expense>(EXPENSES_KEY);
    const id = getNextId('expenses');
    const now = new Date().toISOString();
    
    const newExpense: Expense = {
      ...expenseData,
      id,
      created_at: now,
      updated_at: now
    };
    
    expenses.push(newExpense);
    setStorageData(EXPENSES_KEY, expenses);
    
    return { lastInsertRowid: id };
  },

  update: (id: number, expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): { changes: number } => {
    const expenses = getStorageData<Expense>(EXPENSES_KEY);
    const index = expenses.findIndex(expense => expense.id === id);
    
    if (index === -1) {
      return { changes: 0 };
    }
    
    expenses[index] = {
      ...expenses[index],
      ...expenseData,
      updated_at: new Date().toISOString()
    };
    
    setStorageData(EXPENSES_KEY, expenses);
    return { changes: 1 };
  },

  delete: (id: number): { changes: number } => {
    const expenses = getStorageData<Expense>(EXPENSES_KEY);
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    
    if (filteredExpenses.length === expenses.length) {
      return { changes: 0 };
    }
    
    setStorageData(EXPENSES_KEY, filteredExpenses);
    return { changes: 1 };
  }
};

// Report operations
export const reportOperations = {
  getAll: (): Report[] => {
    return getStorageData<Report>(REPORTS_KEY).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getById: (id: number): Report | undefined => {
    const reports = getStorageData<Report>(REPORTS_KEY);
    return reports.find(report => report.id === id);
  },

  create: (reportData: Omit<Report, 'id' | 'created_at'>): { lastInsertRowid: number } => {
    const reports = getStorageData<Report>(REPORTS_KEY);
    const id = getNextId('reports');
    const now = new Date().toISOString();
    
    const newReport: Report = {
      ...reportData,
      id,
      created_at: now
    };
    
    reports.push(newReport);
    setStorageData(REPORTS_KEY, reports);
    
    return { lastInsertRowid: id };
  },

  delete: (id: number): { changes: number } => {
    const reports = getStorageData<Report>(REPORTS_KEY);
    const filteredReports = reports.filter(report => report.id !== id);
    
    if (filteredReports.length === reports.length) {
      return { changes: 0 };
    }
    
    setStorageData(REPORTS_KEY, filteredReports);
    return { changes: 1 };
  },

  generateProfitLossData: (startDate: string, endDate: string) => {
    const invoices = invoiceOperations.getAll().filter(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return invoiceDate >= start && invoiceDate <= end && invoice.status === 'paid';
    });

    const expenses = expenseOperations.getByDateRange(startDate, endDate);

    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      revenue: {
        invoices: totalRevenue,
        otherIncome: 0,
        total: totalRevenue
      },
      expenses: {
        ...expensesByCategory,
        total: totalExpenses
      },
      netIncome
    };
  }
};

// Initialize database on import
initDatabase();

// Export a mock db object for compatibility
const db = {
  prepare: () => ({
    all: () => [],
    get: () => null,
    run: () => ({ lastInsertRowid: 0, changes: 0 })
  })
};

export default db;
