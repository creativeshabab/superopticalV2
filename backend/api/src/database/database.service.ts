import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;
  private db!: NodePgDatabase<typeof schema>;

  onModuleInit() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:@localhost:5433/super_optical_dev?sslmode=disable';

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.db = drizzle(this.pool, { schema });
    this.logger.log(`Database connected via pool`);
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Database pool connection closed');
    }
  }

  getDb(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  getPool(): Pool {
    return this.pool;
  }

  /**
   * Executes a database transaction with PostgreSQL session variables set for Row-Level Security (RLS).
   */
  async withTenantContext<T>(
    tenantId: string,
    callback: (tx: NodePgDatabase<typeof schema>, client: PoolClient) => Promise<T>,
    storeId?: string
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET ROLE app_user');
      // Set session variables locally for this transaction
      await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
      if (storeId) {
        await client.query(`SELECT set_config('app.current_store_id', $1, true)`, [storeId]);
      }

      const tx = drizzle(client, { schema });
      const result = await callback(tx, client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Performs an active database connection health check.
   */
  async checkHealth(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.db.execute(sql`SELECT 1`);
      return {
        isHealthy: true,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        isHealthy: false,
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}
