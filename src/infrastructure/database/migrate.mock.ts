/**
 * Mock migration runner for frontend verification.
 *
 * In production, migrations will run in Rust backend.
 */

export interface MigrationResult {
  success: boolean;
  error?: string;
}

/**
 * Check if there are pending migrations for the database.
 * Returns true if migrations need to be run.
 */
export async function hasPendingMigrations(dbPath: string): Promise<boolean> {
  console.log('[Mock] hasPendingMigrations for:', dbPath);
  // Mock: For verification, simulate that some databases need migrations
  // In real app, this would check against migration journal
  return false; // Change to true to test backup prompt
}

/**
 * Run all pending migrations.
 * Returns success status and error message if failed.
 */
export async function runMigrations(): Promise<MigrationResult> {
  console.log('[Mock] runMigrations');
  // Mock: In real app, this would invoke Rust command

  try {
    // Simulate migration execution
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error',
    };
  }
}
