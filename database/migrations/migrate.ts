import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export async function runMigrations(connectionString?: string) {
  const conn =
    connectionString ||
    process.env.DATABASE_URL ||
    'postgresql://postgres:@localhost:5433/super_optical_dev?sslmode=disable';

  const pool = new Pool({ connectionString: conn });
  const client = await pool.connect();

  try {
    console.log(`Running database migrations against: ${conn}`);
    const sqlPath = path.resolve(__dirname, '0001_phase2_baseline.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('Migration 0001_phase2_baseline.sql executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute directly if run via CLI
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
