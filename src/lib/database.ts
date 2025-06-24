
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
}

// Storage keys
const CLIENTS_KEY = 'clientbill_clients';
const INVOICES_KEY = 'clientbill_invoices';
const TEMPLATES_KEY = 'clientbill_templates';
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  setStorageData(CLIENTS_KEY, sampleClients);
  setStorageData(INVOICES_KEY, []);
  setStorageData(TEMPLATES_KEY, []);
  localStorage.setItem(COUNTERS_KEY, JSON.stringify({ clients: 3, invoices: 0, templates: 0 }));
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
  
  update: (id: number, templateData: Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at' | 'is_active'>): { changes: number } => {
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
