// Stub for better-sqlite3 — not available in Tauri WebView.
// The app uses mock database connections; this stub prevents the native module from loading.
export default class Database {
  constructor(_path?: string) {
    throw new Error('better-sqlite3 is not available in the WebView renderer. Use Tauri commands instead.');
  }
}
