import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDatabase } from './connection';
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface MigrationResult {
  success: boolean;
  error?: string;
}

/**
 * Check if there are pending migrations for the database.
 * Compares migration journal with available migration files.
 */
export async function hasPendingMigrations(dbPath: string): Promise<boolean> {
  try {
    const db = new Database(dbPath, { readonly: true });

    // Read migration journal from database
    const journalQuery = db.prepare(
      "SELECT key, value FROM __drizzle_migrations WHERE key = 'journal'"
    );
    const journalRow = journalQuery.get() as { key: string; value: string } | undefined;

    if (!journalRow) {
      // No journal found, migrations needed
      db.close();
      return true;
    }

    const appliedMigrations = JSON.parse(journalRow.value);
    db.close();

    // Read available migrations from folder
    const migrationsFolder = './drizzle/migrations';
    const metaPath = join(migrationsFolder, 'meta', '_journal.json');

    if (!existsSync(metaPath)) {
      return false; // No migrations to apply
    }

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
    const availableMigrations = meta.entries || [];

    // Check if there are migrations not yet applied
    return availableMigrations.length > appliedMigrations.length;
  } catch (error) {
    console.error('[migrate] Error checking pending migrations:', error);
    // On error, assume migrations may be needed
    return true;
  }
}

/**
 * Run all pending migrations.
 * Returns success status and error message if failed.
 */
export async function runMigrations(): Promise<MigrationResult> {
  try {
    const db = getDatabase();
    migrate(db, { migrationsFolder: './drizzle/migrations' });
    return { success: true };
  } catch (error) {
    console.error('[migrate] Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error',
    };
  }
}
