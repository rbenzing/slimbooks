// Database service that communicates with backend API
class SQLiteService {
  private isInitialized = false;
  private baseUrl = 'http://localhost:3002/api';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test connection to backend
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error('Backend server not available');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  // API helper methods
  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result;
  }

  // Generic query methods
  async run(sql: string, params: any[] = []): Promise<any> {
    const result = await this.apiCall('/db/run', 'POST', { sql, params });
    return result.result;
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    const result = await this.apiCall('/db/get', 'POST', { sql, params });
    return result.result;
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.apiCall('/db/all', 'POST', { sql, params });
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
