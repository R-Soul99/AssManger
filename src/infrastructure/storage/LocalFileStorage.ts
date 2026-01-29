import { exists, mkdir, copyFile, remove, readDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

export interface StorageConfig {
  basePath: string; // Database directory (images stored relative to this)
}

/**
 * Service for managing floor plan image files.
 *
 * Per RESEARCH.md:
 * - Store paths relative to database file location
 * - Validate file exists before storing path
 * - Provide re-link capability for broken paths
 */
export class LocalFileStorage {
  private basePath: string | null = null;

  /**
   * Initialize storage with database path.
   * Images will be stored relative to database location.
   */
  async initialize(config: StorageConfig): Promise<void> {
    this.basePath = config.basePath;

    // Create floor_plans directory if doesn't exist
    const floorPlansDir = await this.getFloorPlansDirectory();
    if (!await exists(floorPlansDir)) {
      await mkdir(floorPlansDir, { recursive: true });
    }
  }

  /**
   * Get the floor plans directory path.
   */
  async getFloorPlansDirectory(): Promise<string> {
    if (!this.basePath) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return join(this.basePath, 'floor_plans');
  }

  /**
   * Save a floor plan image and return the relative path.
   * @param sourcePath Absolute path to source image file
   * @param fileName Desired file name (will be sanitized)
   * @returns Relative path to stored image (for database storage)
   */
  async saveFloorPlanImage(sourcePath: string, fileName: string): Promise<string> {
    if (!this.basePath) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }

    // Sanitize filename
    const safeFileName = this.sanitizeFileName(fileName);

    // Generate unique name if file exists
    const relativePath = `floor_plans/${await this.generateUniqueName(safeFileName)}`;
    const absolutePath = await join(this.basePath, relativePath);

    // Copy file to storage location
    await copyFile(sourcePath, absolutePath);

    return relativePath;
  }

  /**
   * Get absolute path from relative path.
   * Used when loading images for display.
   */
  async getAbsolutePath(relativePath: string): Promise<string> {
    if (!this.basePath) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return join(this.basePath, relativePath);
  }

  /**
   * Check if a floor plan image exists.
   */
  async imageExists(relativePath: string): Promise<boolean> {
    if (!this.basePath) return false;

    const absolutePath = await join(this.basePath, relativePath);
    return exists(absolutePath);
  }

  /**
   * Delete a floor plan image.
   */
  async deleteImage(relativePath: string): Promise<void> {
    if (!this.basePath) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }

    const absolutePath = await join(this.basePath, relativePath);
    if (await exists(absolutePath)) {
      await remove(absolutePath);
    }
  }

  /**
   * List all images in floor plans directory.
   * Useful for orphan cleanup or re-linking.
   */
  async listImages(): Promise<string[]> {
    if (!this.basePath) return [];

    const floorPlansDir = await this.getFloorPlansDirectory();
    if (!await exists(floorPlansDir)) {
      return [];
    }

    const entries = await readDir(floorPlansDir);
    return entries
      .filter(entry => entry.isFile)
      .map(entry => `floor_plans/${entry.name}`);
  }

  private sanitizeFileName(fileName: string): string {
    // Remove path separators and dangerous characters
    return fileName
      .replace(/[/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  private async generateUniqueName(fileName: string): Promise<string> {
    const floorPlansDir = await this.getFloorPlansDirectory();
    let candidate = fileName;
    let counter = 1;

    while (await exists(await join(floorPlansDir, candidate))) {
      const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
      const base = fileName.replace(`.${ext}`, '');
      candidate = `${base}_${counter}.${ext}`;
      counter++;
    }

    return candidate;
  }
}

// Export singleton instance
export const localFileStorage = new LocalFileStorage();
