import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

// Support both PG* and legacy MYSQL_* env vars for smoother transition
const host = process.env.PGHOST || process.env.POSTGRES_HOST || process.env.MYSQL_HOST || 'localhost';
const port = Number(process.env.PGPORT || process.env.POSTGRES_PORT || process.env.MYSQL_PORT || 5432);
const user = process.env.PGUSER || process.env.POSTGRES_USER || process.env.MYSQL_USER || 'postgres';
const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.MYSQL_PASSWORD || '';
const database = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.MYSQL_DATABASE || 'postgres';

const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  max: 10,
  idleTimeoutMillis: 30000
});

// Convert ":named" params to Postgres $1,$2,... safely (avoids ::type casts)
function toPositional(sql, params) {
  if (!params || typeof params !== 'object') return { text: sql, values: [] };

  const values = [];
  const indexByName = new Map();

  // Replace occurrences of :name that are not part of :: casts
  const text = sql.replace(/(^|[^:]):([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, prefix, name) => {
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      throw new Error(`Missing value for SQL parameter :${name}`);
    }
    if (!indexByName.has(name)) {
      indexByName.set(name, values.length + 1);
      values.push(params[name]);
    }
    const idx = indexByName.get(name);
    return `${prefix}$${idx}`;
  });

  return { text, values };
}

export async function query(sql, params = {}) {
  const trimmed = sql.trim();
  const isInsert = /^insert\s+into/i.test(trimmed);

  // Determine table name to avoid RETURNING on join tables without id
  let text = sql;
  if (isInsert && !/returning\s+\b[^;]+/i.test(sql)) {
    const m = trimmed.match(/^insert\s+into\s+([a-zA-Z0-9_.\"]+)/i);
    const table = m ? m[1].replace(/"/g, '').toLowerCase() : '';
    const noIdTables = new Set(['employee_services']);
    if (!noIdTables.has(table)) {
      text = `${trimmed} RETURNING id`;
    }
  }

  const { text: queryText, values } = toPositional(text, params);
  const result = await pool.query(queryText, values);

  if (isInsert) {
    const id = result.rows?.[0]?.id;
    return { insertId: id };
  }

  return result.rows;
}

export default pool;
