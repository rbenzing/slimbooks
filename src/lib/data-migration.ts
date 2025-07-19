// Data migration utility to transfer LocalStorage data to SQLite
import { sqliteService } from './sqlite-service';

// LocalStorage keys (from original database.ts)
const STORAGE_KEYS = {
  CLIENTS: 'clientbill_clients',
  INVOICES: 'clientbill_invoices',
  TEMPLATES: 'clientbill_templates',
  EXPENSES: 'clientbill_expenses',
  REPORTS: 'clientbill_reports',
  COUNTERS: 'clientbill_counters',
  COMPANY_SETTINGS: 'company_settings',
  INVOICE_NUMBER_SETTINGS: 'invoice_number_settings',
  DATE_TIME_SETTINGS: 'date_time_settings',
  TAX_RATES: 'tax_rates',
  DEFAULT_CURRENCY: 'default_currency',
  DEFAULT_TIMEZONE: 'default_timezone'
};

interface MigrationResult {
  success: boolean;
  migratedTables: string[];
  errors: string[];
  totalRecords: number;
}

export class DataMigration {
  private errors: string[] = [];
  private migratedTables: string[] = [];
  private totalRecords = 0;

  async migrateAllData(): Promise<MigrationResult> {
    this.errors = [];
    this.migratedTables = [];
    this.totalRecords = 0;

    try {
      // Ensure SQLite service is initialized
      if (!sqliteService.isReady()) {
        await sqliteService.initialize();
      }

      // Check if migration has already been done
      const migrationFlag = localStorage.getItem('slimbooks_migration_completed');
      if (migrationFlag === 'true') {
        console.log('Migration already completed, skipping...');
        return {
          success: true,
          migratedTables: ['Already migrated'],
          errors: [],
          totalRecords: 0
        };
      }

      // Migrate each data type
      await this.migrateClients();
      await this.migrateInvoices();
      await this.migrateTemplates();
      await this.migrateExpenses();
      await this.migrateReports();
      await this.migrateCounters();
      await this.migrateSettings();

      // Mark migration as completed
      localStorage.setItem('slimbooks_migration_completed', 'true');

      console.log(`Migration completed successfully. Migrated ${this.totalRecords} records across ${this.migratedTables.length} tables.`);

      return {
        success: this.errors.length === 0,
        migratedTables: this.migratedTables,
        errors: this.errors,
        totalRecords: this.totalRecords
      };
    } catch (error) {
      console.error('Migration failed:', error);
      this.errors.push(`Migration failed: ${error}`);
      return {
        success: false,
        migratedTables: this.migratedTables,
        errors: this.errors,
        totalRecords: this.totalRecords
      };
    }
  }

  private getLocalStorageData<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn(`Failed to parse localStorage data for key ${key}:`, error);
      return [];
    }
  }

  private async migrateClients(): Promise<void> {
    try {
      const clients = this.getLocalStorageData(STORAGE_KEYS.CLIENTS);
      if (clients.length === 0) return;

      const sql = `
        INSERT INTO clients (id, name, email, phone, company, address, city, state, zipCode, country, stripe_customer_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      clients.forEach((client: any) => {
        sqliteService.run(sql, [
          client.id,
          client.name,
          client.email,
          client.phone || '',
          client.company || '',
          client.address || '',
          client.city || '',
          client.state || '',
          client.zipCode || '',
          client.country || '',
          client.stripe_customer_id || null,
          client.created_at,
          client.updated_at
        ]);
      });

      this.migratedTables.push('clients');
      this.totalRecords += clients.length;
      console.log(`Migrated ${clients.length} clients`);
    } catch (error) {
      this.errors.push(`Failed to migrate clients: ${error}`);
    }
  }

  private async migrateInvoices(): Promise<void> {
    try {
      const invoices = this.getLocalStorageData(STORAGE_KEYS.INVOICES);
      if (invoices.length === 0) return;

      const sql = `
        INSERT INTO invoices (id, invoice_number, client_id, template_id, amount, status, due_date, description,
                             stripe_invoice_id, type, client_name, client_email, client_phone, client_address,
                             line_items, tax_amount, tax_rate_id, shipping_amount, shipping_rate_id, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      invoices.forEach((invoice: any) => {
        sqliteService.run(sql, [
          invoice.id,
          invoice.invoice_number,
          invoice.client_id,
          invoice.template_id || null,
          invoice.amount,
          invoice.status,
          invoice.due_date,
          invoice.description || '',
          invoice.stripe_invoice_id || null,
          invoice.type || 'one-time',
          invoice.client_name || '',
          invoice.client_email || '',
          invoice.client_phone || '',
          invoice.client_address || '',
          invoice.line_items || null,
          invoice.tax_amount || 0,
          invoice.tax_rate_id || null,
          invoice.shipping_amount || 0,
          invoice.shipping_rate_id || null,
          invoice.notes || '',
          invoice.created_at,
          invoice.updated_at
        ]);
      });

      this.migratedTables.push('invoices');
      this.totalRecords += invoices.length;
      console.log(`Migrated ${invoices.length} invoices`);
    } catch (error) {
      this.errors.push(`Failed to migrate invoices: ${error}`);
    }
  }

  private async migrateTemplates(): Promise<void> {
    try {
      const templates = this.getLocalStorageData(STORAGE_KEYS.TEMPLATES);
      if (templates.length === 0) return;

      const sql = `
        INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms, 
                              next_invoice_date, is_active, line_items, tax_amount, shipping_amount, 
                              notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      templates.forEach((template: any) => {
        sqliteService.run(sql, [
          template.id,
          template.name,
          template.client_id,
          template.amount,
          template.description || '',
          template.frequency,
          template.payment_terms,
          template.next_invoice_date,
          template.is_active ? 1 : 0,
          template.line_items || null,
          template.tax_amount || 0,
          template.shipping_amount || 0,
          template.notes || '',
          template.created_at,
          template.updated_at
        ]);
      });

      this.migratedTables.push('templates');
      this.totalRecords += templates.length;
      console.log(`Migrated ${templates.length} templates`);
    } catch (error) {
      this.errors.push(`Failed to migrate templates: ${error}`);
    }
  }

  private async migrateExpenses(): Promise<void> {
    try {
      const expenses = this.getLocalStorageData(STORAGE_KEYS.EXPENSES);
      if (expenses.length === 0) return;

      const sql = `
        INSERT INTO expenses (id, date, merchant, category, amount, description, receipt_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      expenses.forEach((expense: any) => {
        sqliteService.run(sql, [
          expense.id,
          expense.date,
          expense.merchant || 'Unknown Merchant',
          expense.category,
          expense.amount,
          expense.description,
          expense.receipt_url || null,
          expense.status || 'pending',
          expense.created_at,
          expense.updated_at
        ]);
      });

      this.migratedTables.push('expenses');
      this.totalRecords += expenses.length;
      console.log(`Migrated ${expenses.length} expenses`);
    } catch (error) {
      this.errors.push(`Failed to migrate expenses: ${error}`);
    }
  }

  private async migrateReports(): Promise<void> {
    try {
      const reports = this.getLocalStorageData(STORAGE_KEYS.REPORTS);
      if (reports.length === 0) return;

      const sql = `
        INSERT INTO reports (id, name, type, date_range_start, date_range_end, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      reports.forEach((report: any) => {
        sqliteService.run(sql, [
          report.id,
          report.name,
          report.type,
          report.date_range_start || '',
          report.date_range_end || '',
          JSON.stringify(report.data || {}),
          report.created_at,
          report.updated_at
        ]);
      });

      this.migratedTables.push('reports');
      this.totalRecords += reports.length;
      console.log(`Migrated ${reports.length} reports`);
    } catch (error) {
      this.errors.push(`Failed to migrate reports: ${error}`);
    }
  }

  private async migrateCounters(): Promise<void> {
    try {
      const countersData = localStorage.getItem(STORAGE_KEYS.COUNTERS);
      if (!countersData) return;

      const counters = JSON.parse(countersData);
      
      Object.entries(counters).forEach(([name, value]) => {
        sqliteService.run(
          'UPDATE counters SET value = ? WHERE name = ?',
          [value, name]
        );
      });

      this.migratedTables.push('counters');
      this.totalRecords += Object.keys(counters).length;
      console.log(`Migrated ${Object.keys(counters).length} counters`);
    } catch (error) {
      this.errors.push(`Failed to migrate counters: ${error}`);
    }
  }

  private async migrateSettings(): Promise<void> {
    try {
      const settingsToMigrate = [
        { key: STORAGE_KEYS.COMPANY_SETTINGS, category: 'company' },
        { key: STORAGE_KEYS.INVOICE_NUMBER_SETTINGS, category: 'invoice' },
        { key: STORAGE_KEYS.DATE_TIME_SETTINGS, category: 'general' },
        { key: STORAGE_KEYS.TAX_RATES, category: 'tax' },
        { key: STORAGE_KEYS.DEFAULT_CURRENCY, category: 'general' },
        { key: STORAGE_KEYS.DEFAULT_TIMEZONE, category: 'general' }
      ];

      let settingsCount = 0;
      settingsToMigrate.forEach(({ key, category }) => {
        const value = localStorage.getItem(key);
        if (value) {
          sqliteService.setSetting(key, value, category);
          settingsCount++;
        }
      });

      if (settingsCount > 0) {
        this.migratedTables.push('settings');
        this.totalRecords += settingsCount;
        console.log(`Migrated ${settingsCount} settings`);
      }
    } catch (error) {
      this.errors.push(`Failed to migrate settings: ${error}`);
    }
  }
}

// Export singleton instance
export const dataMigration = new DataMigration();
