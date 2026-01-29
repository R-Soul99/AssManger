import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

let db: BetterSQLite3Database<typeof schema> | null = null;
let sqlite: Database.Database | null = null;
let currentDbPath: string | null = null;

export interface DatabaseConfig {
  path: string;
  readonly?: boolean;
}

/**
 * Initialize database connection with WAL mode enabled.
 * Safe to call multiple times - will reuse existing connection if same path.
 */
export async function initializeDatabase(config: DatabaseConfig): Promise<BetterSQLite3Database<typeof schema>> {
  // If already connected to same database, return existing connection
  if (db && currentDbPath === config.path) {
    return db;
  }

  // Close existing connection if different database
  if (db) {
    await closeDatabase();
  }

  // Create new SQLite connection
  sqlite = new Database(config.path, {
    readonly: config.readonly ?? false,
  });

  // Enable WAL mode for better concurrency and corruption resistance
  sqlite.pragma('journal_mode = WAL');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Create Drizzle instance with schema
  db = drizzle(sqlite, { schema });
  currentDbPath = config.path;

  return db;
}

/**
 * Get current database instance.
 * Throws if not initialized.
 */
export function getDatabase(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Check if database is currently connected.
 */
export function isDatabaseConnected(): boolean {
  return db !== null;
}

/**
 * Get current database path.
 */
export function getCurrentDatabasePath(): string | null {
  return currentDbPath;
}

/**
 * Close database connection and cleanup.
 */
export async function closeDatabase(): Promise<void> {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
  db = null;
  currentDbPath = null;
}

/**
 * Execute callback within a transaction.
 * Automatically rolls back on error.
 */
export function withTransaction<T>(
  callback: (tx: BetterSQLite3Database<typeof schema>) => T
): T {
  const database = getDatabase();
  // Note: better-sqlite3 uses synchronous transactions
  // Drizzle wraps this in db.transaction()
  return database.transaction(callback) as T;
}
