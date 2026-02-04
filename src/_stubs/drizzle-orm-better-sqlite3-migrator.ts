// Stub for drizzle-orm/better-sqlite3/migrator — prevents native module load in WebView.
export async function migrate(_db: any, _config: any): Promise<void> {
  throw new Error('drizzle better-sqlite3 migrator is not available in the WebView renderer.');
}
