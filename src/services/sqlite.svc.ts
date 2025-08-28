// Database service that communicates with backend API
class SQLiteService {
  private isInitialized = false;
  private baseUrl = 'http://localhost:3002/api';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test connection to backend with retry logic
      let retries = 3;
      let lastError: any;
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
      console.error('Failed to initialize database service after retries:', error);
      throw new Error('Backend server not available');
    }
  }

  // API helper methods
  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
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
  async get(_sql: string, _params: any[] = []): Promise<any> {
    throw new Error('Direct SQL queries are deprecated. Use specific API endpoints instead.');
  }

  async all(_sql: string, _params: any[] = []): Promise<any[]> {
    throw new Error('Direct SQL queries are deprecated. Use specific API endpoints instead.');
  }

  async run(_sql: string, _params: any[] = []): Promise<any> {
    throw new Error('Direct SQL execution is deprecated. Use specific API endpoints instead.');
  }

  // ===== USER API METHODS =====
  async getUsers(): Promise<any[]> {
    const result = await this.apiCall('/users');
    return result.data;
  }

  async getUserById(id: number): Promise<any> {
    const result = await this.apiCall(`/users/${id}`);
    return result.data;
  }

  async getUserByEmail(email: string): Promise<any> {
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

  async createUser(userData: any): Promise<any> {
    const result = await this.apiCall('/users', 'POST', { userData });
    return result.result;
  }

  async getUserByGoogleId(googleId: string): Promise<any> {
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

  async updateUser(id: number, userData: any): Promise<any> {
    const result = await this.apiCall(`/users/${id}`, 'PUT', { userData });
    return result.result;
  }

  async deleteUser(id: number): Promise<any> {
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
  async getClients(): Promise<any[]> {
    const result = await this.apiCall('/clients');
    return result.data;
  }

  async getClientById(id: number): Promise<any> {
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

  async createClient(clientData: any): Promise<any> {
    const result = await this.apiCall('/clients', 'POST', { clientData });
    return result.result;
  }

  async updateClient(id: number, clientData: any): Promise<any> {
    const result = await this.apiCall(`/clients/${id}`, 'PUT', { clientData });
    return result.result;
  }

  async deleteClient(id: number): Promise<any> {
    const result = await this.apiCall(`/clients/${id}`, 'DELETE');
    return result.result;
  }

  // Counter operations
  async getNextId(counterName: string): Promise<number> {
    const result = await this.apiCall(`/counters/${counterName}/next`);
    return result.nextId;
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    const result = await this.apiCall(`/settings/${key}`);
    return result.value;
  }

  async setSetting(key: string, value: any, category: string = 'general'): Promise<void> {
    await this.apiCall('/settings', 'POST', { key, value, category });
  }

  // Bulk settings operations
  async getAllSettings(category?: string): Promise<Record<string, any>> {
    const params = category ? { category } : {};
    const result = await this.apiCall('/settings', 'GET', params);
    return result.settings;
  }

  async setMultipleSettings(settings: Record<string, { value: any; category?: string }>): Promise<void> {
    await this.apiCall('/settings', 'PUT', { settings });
  }

  // ===== INVOICE API METHODS =====
  async getInvoices(): Promise<any[]> {
    const result = await this.apiCall('/invoices');
    return result.data?.invoices || [];
  }

  async getInvoiceById(id: number): Promise<any> {
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

  async createInvoice(invoiceData: any): Promise<any> {
    const result = await this.apiCall('/invoices', 'POST', { invoiceData });
    return result.result;
  }

  async updateInvoice(id: number, invoiceData: any): Promise<any> {
    const result = await this.apiCall(`/invoices/${id}`, 'PUT', { invoiceData });
    return result.result;
  }

  async deleteInvoice(id: number): Promise<any> {
    const result = await this.apiCall(`/invoices/${id}`, 'DELETE');
    return result.result;
  }

  // ===== EXPENSE API METHODS =====
  async getExpenses(startDate?: string, endDate?: string): Promise<any[]> {
    const params = startDate && endDate ? { date_from: startDate, date_to: endDate } : {};
    const result = await this.apiCall('/expenses', 'GET', params);
    return result.data?.expenses || [];
  }

  async getExpenseById(id: number): Promise<any> {
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

  async createExpense(expenseData: any): Promise<any> {
    const result = await this.apiCall('/expenses', 'POST', { expenseData });
    return result.result;
  }

  async bulkImportExpenses(expenses: any[]): Promise<any> {
    const result = await this.apiCall('/expenses/bulk-import', 'POST', { expenses });
    return result.data;
  }

  async bulkDeleteExpenses(expenseIds: number[]): Promise<any> {
    const result = await this.apiCall('/expenses/bulk-delete', 'POST', { expense_ids: expenseIds });
    return result.data;
  }

  async bulkUpdateExpenseCategory(expenseIds: number[], category: string): Promise<any> {
    const result = await this.apiCall('/expenses/bulk-category', 'POST', { expense_ids: expenseIds, category });
    return result.data;
  }

  async bulkUpdateExpenseMerchant(expenseIds: number[], merchant: string): Promise<any> {
    const result = await this.apiCall('/expenses/bulk-merchant', 'POST', { expense_ids: expenseIds, merchant });
    return result.data;
  }

  async updateExpense(id: number, expenseData: any): Promise<any> {
    const result = await this.apiCall(`/expenses/${id}`, 'PUT', { expenseData });
    return result.result;
  }

  async deleteExpense(id: number): Promise<any> {
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
  async getTemplates(): Promise<any[]> {
    const result = await this.apiCall('/templates');
    return result.data;
  }

  async getTemplateById(id: number): Promise<any> {
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

  async createTemplate(templateData: any): Promise<any> {
    const result = await this.apiCall('/templates', 'POST', { templateData });
    return result.result;
  }

  async updateTemplate(id: number, templateData: any): Promise<any> {
    const result = await this.apiCall(`/templates/${id}`, 'PUT', { templateData });
    return result.result;
  }

  async deleteTemplate(id: number): Promise<any> {
    const result = await this.apiCall(`/templates/${id}`, 'DELETE');
    return result.result;
  }

  // ===== REPORT API METHODS =====
  async getReports(): Promise<any[]> {
    const result = await this.apiCall('/reports');
    return result.data;
  }

  async getReportById(id: number): Promise<any> {
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

  async createReport(reportData: any): Promise<any> {
    const result = await this.apiCall('/reports', 'POST', { reportData });
    return result.result;
  }

  async deleteReport(id: number): Promise<any> {
    const result = await this.apiCall(`/reports/${id}`, 'DELETE');
    return result.result;
  }

  // ===== PROJECT SETTINGS API METHODS =====
  async getProjectSettings(): Promise<any> {
    const result = await this.apiCall('/project-settings');
    return result.settings;
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
