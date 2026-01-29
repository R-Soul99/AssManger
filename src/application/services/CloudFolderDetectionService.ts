import { appDataDir, join } from '@tauri-apps/api/path';

export interface CloudCheckResult {
  isSynced: boolean;
  provider?: 'OneDrive' | 'Dropbox' | 'SharePoint' | 'GoogleDrive';
  warning?: string;
}

/**
 * Service for detecting cloud-synced folders that pose SQLite corruption risks.
 *
 * Per CONTEXT.md:
 * - Use environment variable detection + path pattern checking
 * - Explain corruption risk AND provide alternative location
 * - Warn once per session (don't nag every time)
 */
export class CloudFolderDetectionService {
  private warnedPaths: Set<string> = new Set();

  /**
   * Check if a file path is within a cloud-synced folder.
   */
  isCloudSyncedPath(filePath: string): CloudCheckResult {
    const normalizedPath = filePath.toLowerCase().replace(/\//g, '\\');

    // Check OneDrive (environment variables)
    const oneDrivePaths = [
      process.env.OneDrive,
      process.env.OneDriveCommercial,
      process.env.OneDriveConsumer,
    ].filter(Boolean) as string[];

    for (const oneDrivePath of oneDrivePaths) {
      if (normalizedPath.startsWith(oneDrivePath.toLowerCase())) {
        return {
          isSynced: true,
          provider: 'OneDrive',
          warning: this.buildWarning('OneDrive'),
        };
      }
    }

    // Check for OneDrive in path (fallback if env vars missing)
    if (normalizedPath.includes('\\onedrive\\') ||
        normalizedPath.includes('\\onedrive -')) {
      return {
        isSynced: true,
        provider: 'OneDrive',
        warning: this.buildWarning('OneDrive'),
      };
    }

    // Check Dropbox
    const dropboxPath = process.env.DROPBOX_PATH ||
      `${process.env.USERPROFILE || ''}\\Dropbox`;
    if (normalizedPath.startsWith(dropboxPath.toLowerCase()) ||
        normalizedPath.includes('\\dropbox\\')) {
      return {
        isSynced: true,
        provider: 'Dropbox',
        warning: this.buildWarning('Dropbox'),
      };
    }

    // Check SharePoint / Teams synced folders
    if (normalizedPath.includes('\\sharepoint\\') ||
        normalizedPath.includes('\\sites\\') ||
        normalizedPath.includes(' - shared documents\\')) {
      return {
        isSynced: true,
        provider: 'SharePoint',
        warning: this.buildWarning('SharePoint'),
      };
    }

    // Check Google Drive
    if (normalizedPath.includes('\\google drive\\') ||
        normalizedPath.includes('\\my drive\\')) {
      return {
        isSynced: true,
        provider: 'GoogleDrive',
        warning: this.buildWarning('Google Drive'),
      };
    }

    return { isSynced: false };
  }

  /**
   * Get recommended safe location for database files.
   * Per CONTEXT.md: %LOCALAPPDATA%\AssManger
   */
  async getRecommendedLocation(): Promise<string> {
    // Prefer LOCALAPPDATA (Windows standard for app data)
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      return await join(localAppData, 'AssManger');
    }

    // Fallback to Tauri's app data directory
    const appData = await appDataDir();
    return await join(appData, 'databases');
  }

  /**
   * Check if we've already warned about this path this session.
   * Per CONTEXT.md: warn once per session.
   */
  hasWarnedThisSession(filePath: string): boolean {
    return this.warnedPaths.has(filePath.toLowerCase());
  }

  /**
   * Mark a path as warned for this session.
   */
  markAsWarned(filePath: string): void {
    this.warnedPaths.add(filePath.toLowerCase());
  }

  /**
   * Reset session warnings (call when user explicitly dismisses all warnings).
   */
  resetSessionWarnings(): void {
    this.warnedPaths.clear();
  }

  private buildWarning(provider: string): string {
    return `The selected location is in ${provider}, which can cause SQLite database corruption. ` +
      `Cloud sync services interrupt database writes, leading to data loss. ` +
      `We recommend storing your database in %LOCALAPPDATA%\\AssManger for safety.`;
  }
}

// Export singleton instance
export const cloudFolderDetectionService = new CloudFolderDetectionService();
