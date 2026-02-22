import { dirname, resolve } from '@tauri-apps/api/path';

/**
 * FileStorageService - Handles path conversion for database portability
 *
 * Requirement FOUND-04: Store floor plan images using database-relative paths.
 * This enables the database + images folder to be moved together without breaking references.
 *
 * Key principles:
 * - Store paths as relative to database file location
 * - Use forward slashes (/) for cross-platform compatibility
 * - Convert absolute paths when loading images for rendering
 */
export class FileStorageService {
  /**
   * Converts an absolute file path to a path relative to the database location.
   *
   * @param absolutePath - The absolute path to the image file
   * @param databasePath - The absolute path to the database file
   * @returns Relative path from database directory to image file, using forward slashes
   *
   * @example
   * // Database: C:\Projects\myproject.assetmap
   * // Image: C:\Projects\images\floor1.png
   * // Returns: "images/floor1.png"
   */
  static async toRelativePath(absolutePath: string, databasePath: string): Promise<string> {
    // Get directory containing the database file
    const databaseDir = await dirname(databasePath);

    // Normalize both paths to forward slashes for comparison
    const normalizedDbDir = this.normalizePath(databaseDir);
    const normalizedAbsPath = this.normalizePath(absolutePath);

    // Calculate relative path manually
    // If the image path starts with the database directory, make it relative
    if (normalizedAbsPath.startsWith(normalizedDbDir)) {
      let relativePath = normalizedAbsPath.substring(normalizedDbDir.length);
      // Remove leading slash if present
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
      return relativePath;
    }

    // If paths don't share a common base, return the absolute path as-is
    // (user has images outside database directory - we'll store the absolute path)
    return normalizedAbsPath;
  }

  /**
   * Converts a database-relative path back to an absolute path for image loading.
   *
   * @param relativePath - The relative path stored in the database
   * @param databasePath - The absolute path to the database file
   * @returns Absolute path to the image file
   *
   * @example
   * // Database: C:\Projects\myproject.assetmap
   * // Relative path: "images/floor1.png"
   * // Returns: "C:\Projects\images\floor1.png"
   */
  static async toAbsolutePath(relativePath: string, databasePath: string): Promise<string> {
    // Get directory containing the database file
    const databaseDir = await dirname(databasePath);

    // Resolve relative path against database directory
    return await resolve(databaseDir, relativePath);
  }

  /**
   * Normalizes path separators to forward slashes for database storage.
   * Ensures consistent path format across Windows/Mac/Linux.
   *
   * @param filePath - Path with any separator type
   * @returns Path with forward slashes only
   *
   * @example
   * // Input: "images\floor plans\floor1.png"
   * // Output: "images/floor plans/floor1.png"
   */
  static normalizePath(filePath: string): string {
    // Replace all backslashes with forward slashes
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Validates that a path is truly relative (doesn't start with drive letter or root).
   *
   * @param path - Path to validate
   * @returns true if path is relative, false if absolute
   */
  static isRelativePath(path: string): boolean {
    // Check for Windows absolute path (C:\ or \)
    if (path.match(/^[a-zA-Z]:[\\\/]/) || path.startsWith('\\') || path.startsWith('/')) {
      return false;
    }
    return true;
  }
}
