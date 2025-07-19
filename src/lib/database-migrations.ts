// Database migration utilities for adding new columns and features

import { sqliteService } from './sqlite-service';

export class DatabaseMigrations {
  private static instance: DatabaseMigrations;

  static getInstance(): DatabaseMigrations {
    if (!DatabaseMigrations.instance) {
      DatabaseMigrations.instance = new DatabaseMigrations();
    }
    return DatabaseMigrations.instance;
  }

  /**
   * Runs all pending migrations
   */
  async runMigrations(): Promise<void> {
    if (!sqliteService.isReady()) {
      console.log('SQLite service not ready, skipping migrations');
      return;
    }

    try {
      console.log('Running database migrations...');
      
      // Check and run each migration
      await this.addInvoiceEmailColumns();
      await this.addTemplateRateColumns();
      
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Error running database migrations:', error);
    }
  }

  /**
   * Adds email tracking columns to invoices table
   */
  private async addInvoiceEmailColumns(): Promise<void> {
    try {
      // Check if columns already exist
      const hasColumns = await this.checkColumnsExist('invoices', [
        'tax_rate_id',
        'shipping_rate_id', 
        'email_status',
        'email_sent_at',
        'email_error',
        'last_email_attempt'
      ]);

      if (hasColumns) {
        console.log('Invoice email columns already exist, skipping migration');
        return;
      }

      console.log('Adding email tracking columns to invoices table...');

      // Add columns one by one (SQLite doesn't support adding multiple columns in one statement)
      const columnsToAdd = [
        { name: 'tax_rate_id', type: 'TEXT' },
        { name: 'shipping_rate_id', type: 'TEXT' },
        { name: 'email_status', type: 'TEXT DEFAULT "not_sent"' },
        { name: 'email_sent_at', type: 'TEXT' },
        { name: 'email_error', type: 'TEXT' },
        { name: 'last_email_attempt', type: 'TEXT' }
      ];

      for (const column of columnsToAdd) {
        try {
          await this.addColumnIfNotExists('invoices', column.name, column.type);
        } catch (error) {
          // Column might already exist, continue with next one
          console.log(`Column ${column.name} might already exist:`, error);
        }
      }

      console.log('Invoice email columns migration completed');
    } catch (error) {
      console.error('Error adding invoice email columns:', error);
    }
  }

  /**
   * Adds rate ID columns to templates table
   */
  private async addTemplateRateColumns(): Promise<void> {
    try {
      // Check if columns already exist
      const hasColumns = await this.checkColumnsExist('templates', [
        'tax_rate_id',
        'shipping_rate_id'
      ]);

      if (hasColumns) {
        console.log('Template rate columns already exist, skipping migration');
        return;
      }

      console.log('Adding rate ID columns to templates table...');

      const columnsToAdd = [
        { name: 'tax_rate_id', type: 'TEXT' },
        { name: 'shipping_rate_id', type: 'TEXT' }
      ];

      for (const column of columnsToAdd) {
        try {
          await this.addColumnIfNotExists('templates', column.name, column.type);
        } catch (error) {
          // Column might already exist, continue with next one
          console.log(`Column ${column.name} might already exist:`, error);
        }
      }

      console.log('Template rate columns migration completed');
    } catch (error) {
      console.error('Error adding template rate columns:', error);
    }
  }

  /**
   * Adds a column to a table if it doesn't exist
   */
  private async addColumnIfNotExists(tableName: string, columnName: string, columnType: string): Promise<void> {
    try {
      const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
      sqliteService.run(sql);
      console.log(`Added column ${columnName} to ${tableName} table`);
    } catch (error) {
      // If error contains "duplicate column name", it's not a real error
      if (error.toString().includes('duplicate column name')) {
        console.log(`Column ${columnName} already exists in ${tableName} table`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Checks if columns exist in a table
   */
  private async checkColumnsExist(tableName: string, columnNames: string[]): Promise<boolean> {
    try {
      // Get table info
      const tableInfo = await sqliteService.all(`PRAGMA table_info(${tableName})`);
      const existingColumns = tableInfo.map((row: any) => row.name);
      
      // Check if all required columns exist
      const allExist = columnNames.every(columnName => existingColumns.includes(columnName));
      
      return allExist;
    } catch (error) {
      console.error(`Error checking columns in ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Gets the current database schema version
   */
  async getSchemaVersion(): Promise<number> {
    try {
      // Try to get version from a settings table or use a default
      const version = await sqliteService.getSetting('schema_version');
      return version ? parseInt(version) : 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Sets the database schema version
   */
  async setSchemaVersion(version: number): Promise<void> {
    try {
      await sqliteService.setSetting('schema_version', version.toString());
    } catch (error) {
      console.error('Error setting schema version:', error);
    }
  }

  /**
   * Repairs any data inconsistencies
   */
  async repairData(): Promise<void> {
    try {
      console.log('Running data repair...');

      // Set default email_status for existing invoices
      await sqliteService.run(`
        UPDATE invoices
        SET email_status = 'not_sent'
        WHERE email_status IS NULL OR email_status = ''
      `);

      // Set default status for invoices without status
      await sqliteService.run(`
        UPDATE invoices
        SET status = 'draft'
        WHERE status IS NULL OR status = ''
      `);

      console.log('Data repair completed');
    } catch (error) {
      console.error('Error during data repair:', error);
    }
  }

  /**
   * Validates database integrity
   */
  async validateDatabase(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if required tables exist
      const tables = ['invoices', 'clients', 'templates'];
      for (const table of tables) {
        try {
          sqliteService.all(`SELECT 1 FROM ${table} LIMIT 1`);
        } catch (error) {
          errors.push(`Table ${table} is missing or corrupted`);
        }
      }

      // Check if required columns exist in invoices table
      const requiredInvoiceColumns = [
        'id', 'invoice_number', 'client_id', 'amount', 'status', 'due_date',
        'tax_rate_id', 'shipping_rate_id', 'email_status'
      ];
      
      const invoiceTableInfo = sqliteService.all('PRAGMA table_info(invoices)');
      const invoiceColumns = invoiceTableInfo.map((row: any) => row.name);
      
      for (const column of requiredInvoiceColumns) {
        if (!invoiceColumns.includes(column)) {
          errors.push(`Column ${column} is missing from invoices table`);
        }
      }

    } catch (error) {
      errors.push(`Database validation error: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
