/**
 * Mock migration runner for frontend verification.
 *
 * In production, migrations will run in Rust backend.
 */

export async function runMigrations(): Promise<void> {
  console.log('[Mock] runMigrations');
  // Mock: In real app, this would invoke Rust command
}
