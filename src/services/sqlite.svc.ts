// Database service that communicates with backend API
import {
  User,
  Client,
  Invoice,
  InvoiceTemplate,
  Expense,
  Payment,
  Report,
  ImportResult,
  ValidationError
} from '@/types';
class SQLiteService {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private baseUrl = this.getApiBaseUrl();

  private getApiBaseUrl(): string {
    // Check if we're running on HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return 'https://localhost:3002/api';
    }
    return 'http://localhost:3002/api';
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) return;
    
    // If initialization is in progress, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start new initialization
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      // Test connection to backend with retry logic
      let retries = 3;
      let lastError: unknown;
      let delay = 2000; // Start with 2 seconds to avoid rate limiting

      while (retries > 0) {
        try {
          const response = await fetch(`${this.baseUrl}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('Rate limited - too many requests');
            }
            throw new Error(`Backend server responded with status: ${response.status}`);
          }

          this.isInitialized = true;
          this.initializationPromise = null; // Reset promise for future calls
          return;
        } catch (error) {
          lastError = error;
          retries--;

          if (retries > 0) {
            console.warn(`Failed to connect to backend (${error.message}), retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff to avoid rate limiting
          }
        }
      }

      throw lastError;
    } catch (error) {
      this.initializationPromise = null; // Reset promise on failure
      console.error('Failed to initialize database service after retries:', error);
      throw new Error('Backend server not available');
    }
  }

  // API helper methods
  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<{ success: boolean; data?: any; error?: string; result?: any }> {
    let url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is available
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (method === 'GET' && body) {
      // For GET requests, convert body to query parameters
      const params = new URLSearchParams();
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    } else if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Network or server error - this could indicate connection issues
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API call failed');
      }

      return result;
    } catch (error) {
      // Re-throw with more context for connection monitoring
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - likely connection issue
        throw new Error('Network connection failed');
      }

      // Re-throw other errors as-is
      throw error;
    }
  }

  // DEPRECATED: Generic query methods - use specific endpoints instead
  async get(_sql: string, _params: unknown[] = []): Promise<unknown> {
    throw new Error('Direct SQL queries are deprecated. Use specific API endpoints instead.');
  }

  async all(_sql: string, _params: unknown[] = []): Promise<unknown[]> {
    throw new Error('Direct SQL queries are deprecated. Use specific API endpoints instead.');
  }

  async run(_sql: string, _params: unknown[] = []): Promise<unknown> {
    throw new Error('Direct SQL execution is deprecated. Use specific API endpoints instead.');
  }

  // ===== USER API METHODS =====
  async getUsers(): Promise<User[]> {
    const result = await this.apiCall('/users');
    return result.data;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await this.apiCall(`/users/${id}`);
    return result.data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.apiCall(`/users/email/${encodeURIComponent(email)}`);
      return result.data;
    } catch (error) {
      if (error.message.includes('User not found')) {
        return null;
      }
      throw error;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> {
    const result = await this.apiCall('/users', 'POST', { userData });
    return result.result;
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    try {
      const result = await this.apiCall(`/users/google/${encodeURIComponent(googleId)}`);
      return result.data;
    } catch (error) {
      if (error.message.includes('User not found')) {
        return null;
      }
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<{ changes: number }> {
    const result = await this.apiCall(`/users/${id}`, 'PUT', { userData });
    return result.result;
  }

  async deleteUser(id: number): Promise<{ changes: number }> {
    const result = await this.apiCall(`/users/${id}`, 'DELETE');
    return result.result;
  }

  async updateUserLoginAttempts(id: number, attempts: number, lockedUntil?: string): Promise<void> {
    await this.apiCall(`/users/${id}/login-attempts`, 'PUT', { attempts, lockedUntil });
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await this.apiCall(`/users/${id}/last-login`, 'PUT');
  }

  async verifyUserEmail(id: number): Promise<void> {
    await this.apiCall(`/users/${id}/verify-email`, 'PUT');
  }

  // ===== CLIENT API METHODS =====
  async getClients(): Promise<Client[]> {
    const result = await this.apiCall('/clients');
    return result.data;
  }

  async getClientById(id: number): Promise<Client | null> {
    try {
      const result = await this.apiCall(`/clients/${id}`);
      return result.data;
    } catch (error) {
      if (error.message.includes('Client not found')) {
        return null;
      }
      throw error;
    }
  }

  async createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> {
    const result = await this.apiCall('/clients', 'POST', { clientData });
    return result.result;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<{ changes: number }> {
    const result = await this.apiCall(`/clients/${id}`, 'PUT', { clientData });
    return result.result;
  }

  async deleteClient(id: number): Promise<{ changes: number }> {
    const result = await this.apiCall(`/clients/${id}`, 'DELETE');
    return result.result;
  }

  // Counter operations
  async getNextId(counterName: string): Promise<number> {
    const result = await this.apiCall(`/counters/${counterName}/next`);
    if (result.error) {
      throw result.error;
    }
    return result.data?.nextId;
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    // Map specific keys to new section-based routes
    const sectionMappings = {
      'company_settings': 'company',
      'notification_settings': 'notification', 
      'currency_format_settings': 'currency'
    };
    
    const section = sectionMappings[key];
    if (section) {
      const result = await this.apiCall(`/settings/${section}`);
      // For notification settings, extract the nested value
      if (key === 'notification_settings' && result.data?.settings) {
        return result.data?.settings.notification_settings;
      }
      return result.data?.value;
    }
    
    // Fall back to original route for other keys
    const result = await this.apiCall(`/settings/${key}`);
    return result.data?.value;
  }

  async setSetting(key: string, value: any, category: string = 'general'): Promise<void> {
    await this.apiCall('/settings', 'POST', { key, value, category });
  }

  // Bulk settings operations
  async getAllSettings(category?: string): Promise<Record<string, any>> {
    // Map categories to new section-based routes
    if (category === 'appearance') {
      const result = await this.apiCall('/settings/appearance');
      return result.data?.settings;
    }
    if (category === 'general') {
      const result = await this.apiCall('/settings/general');
      return result.data?.settings;
    }
    
    // Fall back to original query parameter route for other categories
    const params = category ? { category } : {};
    const result = await this.apiCall('/settings', 'GET', params);
    return result.data?.settings;
  }

  async setMultipleSettings(settings: Record<string, { value: any; category?: string }>): Promise<void> {
    await this.apiCall('/settings', 'PUT', { settings });
  }

  // ===== INVOICE API METHODS =====
  async getInvoices(): Promise<(Invoice & { client_name: string })[]> {
    const result = await this.apiCall('/invoices');
    return result.data?.invoices || [];
  }

  async getInvoiceById(id: number): Promise<(Invoice & { client_name: string }) | null> {
    try {
      const result = await this.apiCall(`/invoices/${id}`);
      return result.data;
    } catch (error) {
      if (error.message.includes('Invoice not found')) {
        return null;
      }
      throw error;
    }
  }

  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> {
    const result = await this.apiCall('/invoices', 'POST', { invoiceData });
    return result.result;
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<{ changes: number }> {
    const result = await this.apiCall(`/invoices/${id}`, 'PUT', { invoiceData });
    return result.result;
  }

  async deleteInvoice(id: number): Promise<{ changes: number }> {
    const result = await this.apiCall(`/invoices/${id}`, 'DELETE');
    return result.result;
  }

  // ===== EXPENSE API METHODS =====
  async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    const params = startDate && endDate ? { date_from: startDate, date_to: endDate } : {};
    const result = await this.apiCall('/expenses', 'GET', params);
    return result.data?.expenses || [];
  }

  async getExpenseById(id: number): Promise<Expense | null> {
    try {
      const result = await this.apiCall(`/expenses/${id}`);
      return result.data;
    } catch (error) {
      if (error.message.includes('Expense not found')) {
        return null;
      }
      throw error;
    }
  }

  async createExpense(expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> {
    const result = await this.apiCall('/expenses', 'POST', { expenseData });
    return result.result;
  }

  async bulkImportExpenses(expenses: Partial<Expense>[]): Promise<ImportResult<ValidationError>> {
    const result = await this.apiCall('/expenses/bulk-import', 'POST', { expenses });
    return result.data;
  }

  async bulkDeleteExpenses(expenseIds: number[]): Promise<{ changes: number }> {
    const result = await this.apiCall('/expenses/bulk-delete', 'POST', { expense_ids: expenseIds });
    return result.data;
  }

  async bulkUpdateExpenseCategory(expenseIds: number[], category: string): Promise<{ changes: number }> {
    const result = await this.apiCall('/expenses/bulk-category', 'POST', { expense_ids: expenseIds, category });
    return result.data;
  }

  async bulkUpdateExpenseMerchant(expenseIds: number[], merchant: string): Promise<{ changes: number }> {
    const result = await this.apiCall('/expenses/bulk-merchant', 'POST', { expense_ids: expenseIds, merchant });
    return result.data;
  }

  async updateExpense(id: number, expenseData: Partial<Expense>): Promise<{ changes: number }> {
    const result = await this.apiCall(`/expenses/${id}`, 'PUT', { expenseData });
    return result.result;
  }

  async deleteExpense(id: number): Promise<{ changes: number }> {
    const result = await this.apiCall(`/expenses/${id}`, 'DELETE');
    return result.result;
  }

  // ===== PAYMENT API METHODS =====
  async getPayments(startDate?: string, endDate?: string): Promise<any[]> {
    const params = startDate && endDate ? { date_from: startDate, date_to: endDate } : {};
    const result = await this.apiCall('/payments', 'GET', params);
    return result.data?.payments || [];
  }

  async createPayment(paymentData: any): Promise<any> {
    const result = await this.apiCall('/payments', 'POST', { paymentData });
    return result.result;
  }

  async updatePayment(id: number, paymentData: any): Promise<any> {
    const result = await this.apiCall(`/payments/${id}`, 'PUT', { paymentData });
    return result.result;
  }

  async deletePayment(id: number): Promise<any> {
    const result = await this.apiCall(`/payments/${id}`, 'DELETE');
    return result.result;
  }

  async bulkDeletePayments(paymentIds: number[]): Promise<any> {
    const result = await this.apiCall('/payments/bulk-delete', 'POST', { payment_ids: paymentIds });
    return result.data;
  }

  // ===== TEMPLATE API METHODS =====
  async getTemplates(): Promise<(InvoiceTemplate & { client_name: string })[]> {
    const result = await this.apiCall('/templates');
    return result.data;
  }

  async getTemplateById(id: number): Promise<(InvoiceTemplate & { client_name: string }) | null> {
    try {
      const result = await this.apiCall(`/templates/${id}`);
      return result.data;
    } catch (error) {
      if (error.message.includes('Template not found')) {
        return null;
      }
      throw error;
    }
  }

  async createTemplate(templateData: Omit<InvoiceTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ lastInsertRowid: number }> {
    const result = await this.apiCall('/templates', 'POST', { templateData });
    return result.result;
  }

  async updateTemplate(id: number, templateData: Partial<InvoiceTemplate>): Promise<{ changes: number }> {
    const result = await this.apiCall(`/templates/${id}`, 'PUT', { templateData });
    return result.result;
  }

  async deleteTemplate(id: number): Promise<{ changes: number }> {
    const result = await this.apiCall(`/templates/${id}`, 'DELETE');
    return result.result;
  }

  // ===== REPORT API METHODS =====
  async getReports(): Promise<Report[]> {
    const result = await this.apiCall('/reports');
    return result.data;
  }

  async getReportById(id: number): Promise<Report | null> {
    try {
      const result = await this.apiCall(`/reports/${id}`);
      return result.data;
    } catch (error) {
      if (error.message.includes('Report not found')) {
        return null;
      }
      throw error;
    }
  }

  async createReport(reportData: Omit<Report, 'id' | 'created_at'>): Promise<{ lastInsertRowid: number }> {
    const result = await this.apiCall('/reports', 'POST', { reportData });
    return result.result;
  }

  async deleteReport(id: number): Promise<{ changes: number }> {
    const result = await this.apiCall(`/reports/${id}`, 'DELETE');
    return result.result;
  }

  // ===== PROJECT SETTINGS API METHODS =====
  async getProjectSettings(): Promise<any> {
    if (!this.isReady()) {
      await this.initialize();
    }
    const result = await this.apiCall('/project-settings');
    return result.data?.settings;
  }

  async updateProjectSettings(settings: any): Promise<void> {
    await this.apiCall('/project-settings', 'PUT', { settings });
  }

  // Utility method to check if database is ready
  isReady(): boolean {
    return this.isInitialized;
  }

  // Export database to file
  async exportToFile(): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/db/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Database export error:', error);
      throw error;
    }
  }

  // Import database from file
  async importFromFile(file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('database', file);

      const response = await fetch(`${this.baseUrl}/db/import`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Import failed: ${errorText}`);
      }

      // Reinitialize after import
      this.isInitialized = false;
      await this.initialize();
    } catch (error) {
      console.error('Database import error:', error);
      throw error;
    }
  }

  // Close database connection (no-op for API service)
  close(): void {
    this.isInitialized = false;
  }
}

// Create singleton instance
export const sqliteService = new SQLiteService();

// Initialize on module load (in browser environment)
if (typeof window !== 'undefined') {
  sqliteService.initialize().catch(console.error);
}
