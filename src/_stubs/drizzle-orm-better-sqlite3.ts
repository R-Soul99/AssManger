// Stub for drizzle-orm/better-sqlite3 — prevents native module load in WebView.
export type BetterSQLite3Database<_T = any> = any;
export function drizzle(_db: any): any {
  throw new Error('drizzle better-sqlite3 driver is not available in the WebView renderer.');
}
