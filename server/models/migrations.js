// Database migrations for Slimbooks
// Handles schema updates and data migrations

/**
 * Run all database migrations
 * @param {Database} db - SQLite database instance
 */
export const runMigrations = (db) => {
  console.log('Running database migrations...');

  try {
    // Migration 1: Add missing columns to invoices table
    migrateInvoicesTable(db);
    
    // Migration 2: Migrate templates table to new schema
    migrateTemplatesTable(db);
    
    // Migration 3: Recover templates from backup if needed
    recoverTemplatesFromBackup(db);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

/**
 * Add missing columns to invoices table
 * @param {Database} db - SQLite database instance
 */
const migrateInvoicesTable = (db) => {
  // Check if invoices table has the new columns
  const tableInfo = db.prepare("PRAGMA table_info(invoices)").all();
  const existingColumns = tableInfo.map(col => col.name);

  const requiredColumns = [
    { name: 'template_id', type: 'INTEGER' },
    { name: 'type', type: 'TEXT DEFAULT "one-time"' },
    { name: 'client_name', type: 'TEXT' },
    { name: 'client_email', type: 'TEXT' },
    { name: 'client_phone', type: 'TEXT' },
    { name: 'client_address', type: 'TEXT' },
    { name: 'line_items', type: 'TEXT' },
    { name: 'tax_rate_id', type: 'TEXT' },
    { name: 'shipping_amount', type: 'REAL DEFAULT 0' },
    { name: 'shipping_rate_id', type: 'TEXT' },
    { name: 'email_error', type: 'TEXT' },
    { name: 'last_email_attempt', type: 'TEXT' }
  ];

  // Add missing columns
  for (const column of requiredColumns) {
    if (!existingColumns.includes(column.name)) {
      try {
        db.exec(`ALTER TABLE invoices ADD COLUMN ${column.name} ${column.type}`);
        console.log(`Added column: ${column.name}`);
      } catch (error) {
        console.log(`Column ${column.name} might already exist or error:`, error.message);
      }
    }
  }
};

/**
 * Migrate templates table to new schema
 * @param {Database} db - SQLite database instance
 */
const migrateTemplatesTable = (db) => {
  // Check if templates table has the new schema
  const templateTableInfo = db.prepare("PRAGMA table_info(templates)").all();
  const templateColumns = templateTableInfo.map(col => col.name);

  // Check if we need to migrate templates table
  const needsTemplateMigration = !templateColumns.includes('client_id') ||
                                 !templateColumns.includes('frequency') ||
                                 !templateColumns.includes('line_items');

  if (needsTemplateMigration) {
    console.log('Migrating templates table to new schema...');

    try {
      // Backup existing templates
      const existingTemplates = db.prepare('SELECT * FROM templates').all();
      console.log(`Found ${existingTemplates.length} existing templates to migrate`);

      // Create backup table
      db.exec('DROP TABLE IF EXISTS templates_backup');
      db.exec('ALTER TABLE templates RENAME TO templates_backup');

      // Create new templates table with correct schema
      db.exec(`
        CREATE TABLE templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          client_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          frequency TEXT NOT NULL,
          payment_terms TEXT NOT NULL,
          next_invoice_date TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          line_items TEXT,
          tax_amount REAL DEFAULT 0,
          tax_rate_id TEXT,
          shipping_amount REAL DEFAULT 0,
          shipping_rate_id TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Try to migrate existing templates if they have compatible data
      if (existingTemplates.length > 0) {
        console.log('Attempting to migrate existing template data...');
        migrateTemplateData(db, existingTemplates);
      }

      console.log('Templates table migration completed successfully');

    } catch (migrationError) {
      console.error('Template migration failed:', migrationError);
      // If migration fails, restore from backup if it exists
      try {
        db.exec('DROP TABLE IF EXISTS templates');
        db.exec('ALTER TABLE templates_backup RENAME TO templates');
        console.log('Restored templates from backup due to migration failure');
      } catch (restoreError) {
        console.error('Failed to restore templates backup:', restoreError);
      }
    }
  }
};

/**
 * Migrate individual template data
 * @param {Database} db - SQLite database instance
 * @param {Array} existingTemplates - Array of existing template records
 */
const migrateTemplateData = (db, existingTemplates) => {
  for (const oldTemplate of existingTemplates) {
    try {
      // Only migrate if we have the minimum required fields
      if (oldTemplate.name && oldTemplate.client_id) {
        const migratedTemplate = {
          id: oldTemplate.id,
          name: oldTemplate.name,
          client_id: oldTemplate.client_id,
          amount: oldTemplate.amount || 0,
          description: oldTemplate.description || oldTemplate.items || '',
          frequency: oldTemplate.frequency || 'monthly',
          payment_terms: oldTemplate.payment_terms || 'net_30',
          next_invoice_date: oldTemplate.next_invoice_date || new Date().toISOString().split('T')[0],
          is_active: oldTemplate.is_active !== undefined ? oldTemplate.is_active : 1,
          line_items: oldTemplate.line_items || null,
          tax_amount: oldTemplate.tax_amount || 0,
          tax_rate_id: oldTemplate.tax_rate_id || null,
          shipping_amount: oldTemplate.shipping_amount || 0,
          shipping_rate_id: oldTemplate.shipping_rate_id || null,
          notes: oldTemplate.notes || '',
          created_at: oldTemplate.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const insertStmt = db.prepare(`
          INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                                next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                                shipping_amount, shipping_rate_id, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          migratedTemplate.id,
          migratedTemplate.name,
          migratedTemplate.client_id,
          migratedTemplate.amount,
          migratedTemplate.description,
          migratedTemplate.frequency,
          migratedTemplate.payment_terms,
          migratedTemplate.next_invoice_date,
          migratedTemplate.is_active,
          migratedTemplate.line_items,
          migratedTemplate.tax_amount,
          migratedTemplate.tax_rate_id,
          migratedTemplate.shipping_amount,
          migratedTemplate.shipping_rate_id,
          migratedTemplate.notes,
          migratedTemplate.created_at,
          migratedTemplate.updated_at
        );

        console.log(`Migrated template: ${migratedTemplate.name}`);
      }
    } catch (templateError) {
      console.error(`Failed to migrate template ${oldTemplate.name}:`, templateError.message);
    }
  }
};

/**
 * Recover templates from backup table if needed
 * @param {Database} db - SQLite database instance
 */
const recoverTemplatesFromBackup = (db) => {
  try {
    const backupTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='templates_backup'").get();
    if (backupTableExists) {
      const backupTemplates = db.prepare('SELECT * FROM templates_backup').all();
      const mainTemplates = db.prepare('SELECT * FROM templates').all();

      console.log(`Found ${backupTemplates.length} templates in backup table and ${mainTemplates.length} in main table`);

      if (backupTemplates.length > 0 && mainTemplates.length === 0) {
        console.log('Recovering templates from backup table...');

        for (const template of backupTemplates) {
          try {
            // Map old template structure to new structure
            const migratedTemplate = {
              id: template.id,
              name: template.name || 'Untitled Template',
              client_id: template.client_id || 1, // Default to first client if missing
              amount: template.amount || 0,
              description: template.description || template.items || '',
              frequency: template.frequency || 'monthly',
              payment_terms: template.payment_terms || 'net_30',
              next_invoice_date: template.next_invoice_date || new Date().toISOString().split('T')[0],
              is_active: template.status === 'active' ? 1 : 0,
              line_items: template.items || null,
              tax_amount: template.tax_amount || 0,
              tax_rate_id: template.tax_rate_id || null,
              shipping_amount: template.shipping_amount || 0,
              shipping_rate_id: template.shipping_rate_id || null,
              notes: template.notes || null,
              created_at: template.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const insertStmt = db.prepare(`
              INSERT INTO templates (id, name, client_id, amount, description, frequency, payment_terms,
                                    next_invoice_date, is_active, line_items, tax_amount, tax_rate_id,
                                    shipping_amount, shipping_rate_id, notes, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            insertStmt.run(
              migratedTemplate.id,
              migratedTemplate.name,
              migratedTemplate.client_id,
              migratedTemplate.amount,
              migratedTemplate.description,
              migratedTemplate.frequency,
              migratedTemplate.payment_terms,
              migratedTemplate.next_invoice_date,
              migratedTemplate.is_active,
              migratedTemplate.line_items,
              migratedTemplate.tax_amount,
              migratedTemplate.tax_rate_id,
              migratedTemplate.shipping_amount,
              migratedTemplate.shipping_rate_id,
              migratedTemplate.notes,
              migratedTemplate.created_at,
              migratedTemplate.updated_at
            );

            console.log(`Successfully recovered template: ${migratedTemplate.name}`);
          } catch (templateError) {
            console.error(`Failed to recover template ${template.id}:`, templateError.message);
          }
        }

        // Now clean up backup table
        db.exec('DROP TABLE IF EXISTS templates_backup');
        console.log('Template recovery completed and backup table cleaned up');
      }
    }
  } catch (recoveryError) {
    console.error('Template recovery failed:', recoveryError.message);
  }
};
