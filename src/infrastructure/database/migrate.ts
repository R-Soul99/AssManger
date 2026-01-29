import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDatabase } from './connection';

/**
 * Run all pending migrations.
 * Call after initializing database connection.
 */
export async function runMigrations(): Promise<void> {
  const db = getDatabase();
  migrate(db, { migrationsFolder: './drizzle/migrations' });
}
