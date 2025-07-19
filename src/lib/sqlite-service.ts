// SQLite database service for browser using sql.js
import initSqlJs, { Database } from 'sql.js';
import { DATABASE_SCHEMA, DATABASE_INDEXES, DATABASE_TRIGGERS, INITIAL_COUNTERS } from './sqlite-schema';

class SQLiteService {
  private db: Database | null = null;
  private SQL: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize sql.js
      this.SQL = await initSqlJs({
        // You can specify the path to the wasm file if needed
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('slimbooks_sqlite_db');
      if (savedDb) {
        // Load existing database
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new this.SQL.Database(uint8Array);
        // Always ensure all tables exist (for new tables added to schema)
        await this.createTables();
      } else {
        // Create new database
        this.db = new this.SQL.Database();
        await this.createTables();
        await this.initializeCounters();
      }

      this.isInitialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create all tables
    Object.values(DATABASE_SCHEMA).forEach(sql => {
      this.db!.run(sql);
    });

    // Run schema migrations for existing tables
    await this.runSchemaMigrations();

    // Create indexes
    DATABASE_INDEXES.forEach(sql => {
      this.db!.run(sql);
    });

    // Create triggers
    DATABASE_TRIGGERS.forEach(sql => {
      this.db!.run(sql);
    });
  }

  private async runSchemaMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if expenses table has merchant column
      const expensesTableInfo = this.db.exec("PRAGMA table_info(expenses)");
      if (expensesTableInfo.length > 0) {
        const expensesColumns = expensesTableInfo[0].values.map((row: any) => row[1]); // column names are at index 1

        if (!expensesColumns.includes('merchant')) {
          console.log('Adding merchant column to expenses table...');
          this.db.run('ALTER TABLE expenses ADD COLUMN merchant TEXT NOT NULL DEFAULT "Unknown Merchant"');
        }
      }

      // Check if reports table has date_range columns
      const reportsTableInfo = this.db.exec("PRAGMA table_info(reports)");
      if (reportsTableInfo.length > 0) {
        const reportsColumns = reportsTableInfo[0].values.map((row: any) => row[1]);

        if (!reportsColumns.includes('date_range_start')) {
          console.log('Adding date_range_start column to reports table...');
          this.db.run('ALTER TABLE reports ADD COLUMN date_range_start TEXT NOT NULL DEFAULT ""');
        }

        if (!reportsColumns.includes('date_range_end')) {
          console.log('Adding date_range_end column to reports table...');
          this.db.run('ALTER TABLE reports ADD COLUMN date_range_end TEXT NOT NULL DEFAULT ""');
        }
      }
    } catch (error) {
      console.warn('Schema migration warning:', error);
      // Don't throw error as this might be expected for new databases
    }
  }

  private async initializeCounters(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('INSERT INTO counters (name, value) VALUES (?, ?)');
    INITIAL_COUNTERS.forEach(counter => {
      stmt.run([counter.name, counter.value]);
    });
    stmt.free();
  }

  async saveToLocalStorage(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const data = this.db.export();
      const dataArray = Array.from(data);
      localStorage.setItem('slimbooks_sqlite_db', JSON.stringify(dataArray));
    } catch (error) {
      console.error('Failed to save database to localStorage:', error);
      throw error;
    }
  }

  async exportToFile(): Promise<Blob> {
    if (!this.db) throw new Error('Database not initialized');

    const data = this.db.export();
    return new Blob([data], { type: 'application/x-sqlite3' });
  }

  async importFromFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      if (this.db) {
        this.db.close();
      }
      
      this.db = new this.SQL.Database(uint8Array);
      await this.saveToLocalStorage();
      console.log('Database imported successfully');
    } catch (error) {
      console.error('Failed to import database:', error);
      throw error;
    }
  }

  // Generic query methods
  run(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
    this.saveToLocalStorage(); // Auto-save after modifications
  }

  get(sql: string, params: any[] = []): any {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    const result = stmt.getAsObject(params);
    stmt.free();
    return result;
  }

  all(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // Counter operations
  getNextId(counterName: string): number {
    const result = this.get('SELECT value FROM counters WHERE name = ?', [counterName]);
    const currentValue = result?.value || 0;
    const nextValue = currentValue + 1;
    this.run('UPDATE counters SET value = ? WHERE name = ?', [nextValue, counterName]);
    return nextValue;
  }

  // Settings operations
  getSetting(key: string): any {
    const result = this.get('SELECT value FROM settings WHERE key = ?', [key]);
    if (result?.value) {
      try {
        return JSON.parse(result.value);
      } catch {
        return result.value;
      }
    }
    return null;
  }

  setSetting(key: string, value: any, category: string = 'general'): void {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    this.run(
      'INSERT OR REPLACE INTO settings (key, value, category) VALUES (?, ?, ?)',
      [key, jsonValue, category]
    );
  }

  // Utility method to check if database is ready
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
  }
}

// Create singleton instance
export const sqliteService = new SQLiteService();

// Make it available globally for synchronous access
if (typeof window !== 'undefined') {
  (window as any).sqliteService = sqliteService;
}

// Initialize on module load
sqliteService.initialize().catch(console.error);
