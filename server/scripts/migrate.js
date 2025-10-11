import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
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

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: false
  });

  try {
    for (const statement of statements) {
      // eslint-disable-next-line no-await-in-loop
      await connection.execute(statement);
    }
    console.log('Database migrated successfully.');
  } finally {
    await connection.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});

