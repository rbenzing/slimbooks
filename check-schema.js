import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'slimbooks.db');
const db = new Database(dbPath);

console.log('Invoice table schema:');
const schema = db.prepare('PRAGMA table_info(invoices)').all();
schema.forEach(col => {
  console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
});

db.close();
