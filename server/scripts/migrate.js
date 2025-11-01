import dotenv from 'dotenv';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const schemaPath = path.resolve(__dirname, '..', '..', 'docs', 'database-schema.sql');
  const sql = await readFile(schemaPath, 'utf8');
  const sanitized = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  const statements = sanitized
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  if (statements.length === 0) {
    console.log('No SQL statements found in schema file.');
    return;
  }

  const { Client } = pkg;
  const client = new Client({
    host: process.env.PGHOST || process.env.POSTGRES_HOST || process.env.MYSQL_HOST,
    port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || process.env.MYSQL_PORT || 5432),
    user: process.env.PGUSER || process.env.POSTGRES_USER || process.env.MYSQL_USER,
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.MYSQL_PASSWORD,
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.MYSQL_DATABASE
  });
  await client.connect();

  try {
    for (const statement of statements) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await client.query(statement);
      } catch (err) {
        // Ignore duplicates to allow re-running migrations idempotently
        // Postgres error codes: 42710 duplicate_object (e.g., CREATE TYPE), 42P07 duplicate_table
        if (err && (err.code === '42710' || err.code === '42P07')) {
          console.warn(`Skipping duplicate creation: ${err.message}`);
          continue;
        }
        throw err;
      }
    }
    console.log('Database migrated successfully.');
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
