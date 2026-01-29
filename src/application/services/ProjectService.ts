import { open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, copyFile } from '@tauri-apps/plugin-fs';
import { join, basename, dirname } from '@tauri-apps/api/path';
// TEMPORARY: Using mocks for checkpoint verification
// TODO: Replace with Tauri commands in Rust backend
import { initializeDatabase, closeDatabase, getCurrentDatabasePath } from '@/infrastructure/database/connection.mock';
import { runMigrations } from '@/infrastructure/database/migrate.mock';
import { cloudFolderDetectionService } from './CloudFolderDetectionService';
import { localFileStorage } from '@/infrastructure/storage/LocalFileStorage';
import {
  RecentProject,
  ProjectCreateOptions,
  CreateProjectResult,
  OpenProjectResult,
} from '../dto/ProjectDto';

const RECENT_PROJECTS_KEY = 'assmanger_recent_projects';
const MAX_RECENT_PROJECTS = 5;
const DEFAULT_EXTENSION = '.assetmap';
const SUPPORTED_EXTENSIONS = ['.assetmap', '.db', '.sqlite'];

/**
 * Service for managing project lifecycle (create, open, close).
 *
 * Per CONTEXT.md:
 * - Default location: %LOCALAPPDATA%\AssManger
 * - Remember 5 most recently opened databases
 * - .assetmap preferred extension, support .db/.sqlite for opening
 * - Show clear error for missing/corrupted files and remove from recent
 */
export class ProjectService {
  /**
   * Create a new project database.
   */
  async createNewProject(options: ProjectCreateOptions): Promise<CreateProjectResult> {
    // Check for cloud-synced folder
    if (!options.ignoreCloudWarning) {
      const cloudCheck = cloudFolderDetectionService.isCloudSyncedPath(options.location);
      if (cloudCheck.isSynced && !cloudFolderDetectionService.hasWarnedThisSession(options.location)) {
        cloudFolderDetectionService.markAsWarned(options.location);
        return {
          success: false,
          cloudWarning: {
            provider: cloudCheck.provider!,
            message: cloudCheck.warning!,
            recommendedLocation: await cloudFolderDetectionService.getRecommendedLocation(),
          },
        };
      }
    }

    try {
      // Create directory if doesn't exist
      if (!await exists(options.location)) {
        await mkdir(options.location, { recursive: true });
      }

      // Build database path
      const fileName = options.name.endsWith(DEFAULT_EXTENSION)
        ? options.name
        : `${options.name}${DEFAULT_EXTENSION}`;
      const dbPath = await join(options.location, fileName);

      // Check if file already exists
      if (await exists(dbPath)) {
        return {
          success: false,
          error: `A project file already exists at ${dbPath}. Choose a different name or location.`,
        };
      }

      // Initialize database (creates file)
      await initializeDatabase({ path: dbPath });

      // Run migrations to create tables
      await runMigrations();

      // Initialize file storage
      // MOCK: Disabled for checkpoint
      // await localFileStorage.initialize({ basePath: options.location });

      // Reset repository factory for new database
      // RepositoryFactory.reset(); // MOCK: Disabled for checkpoint

      // Add to recent projects
      this.addToRecentProjects({
        path: dbPath,
        name: options.name,
        lastOpened: new Date(),
      });

      return { success: true, path: dbPath };
    } catch (error) {
      console.error('[ProjectService] Create project error:', error);
      return {
        success: false,
        error: `Failed to create project: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  /**
   * Open an existing project database.
   */
  async openExistingProject(dbPath: string): Promise<OpenProjectResult> {
    // Validate file exists
    if (!await exists(dbPath)) {
      this.removeFromRecentProjects(dbPath);
      return {
        success: false,
        error: `Database file not found: ${dbPath}. It may have been moved or deleted.`,
      };
    }

    // Validate extension
    const ext = dbPath.toLowerCase().slice(dbPath.lastIndexOf('.'));
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return {
        success: false,
        error: `Unsupported file type. Please select a ${SUPPORTED_EXTENSIONS.join(', ')} file.`,
      };
    }

    try {
      // Close existing connection if any
      if (getCurrentDatabasePath()) {
        await closeDatabase();
      }

      // Initialize database connection
      await initializeDatabase({ path: dbPath });

      // Run any pending migrations
      await runMigrations();

      // Initialize file storage
      // const dbDir = await dirname(dbPath);
      // MOCK: Disabled for checkpoint
      // await localFileStorage.initialize({ basePath: dbDir });

      // Reset repository factory for new database
      // RepositoryFactory.reset(); // MOCK: Disabled for checkpoint

      // Extract project name
      const fileName = await basename(dbPath);
      const name = fileName.replace(/\.(assetmap|db|sqlite)$/i, '');

      // Add to recent projects
      this.addToRecentProjects({
        path: dbPath,
        name,
        lastOpened: new Date(),
      });

      return { success: true, path: dbPath, name };
    } catch (error) {
      // Database may be corrupted
      this.removeFromRecentProjects(dbPath);
      return {
        success: false,
        error: `Failed to open project. The database may be corrupted: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Show file picker to select existing database.
   */
  async showOpenDialog(): Promise<string | null> {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Asset Map Database',
          extensions: ['assetmap', 'db', 'sqlite'],
        },
      ],
    });

    return selected as string | null;
  }

  /**
   * Show folder picker for new project location.
   */
  async showFolderDialog(): Promise<string | null> {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    return selected as string | null;
  }

  /**
   * Get default location for new projects.
   */
  async getDefaultLocation(): Promise<string> {
    return cloudFolderDetectionService.getRecommendedLocation();
  }

  /**
   * Get list of recently opened projects.
   */
  getRecentProjects(): RecentProject[] {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!stored) return [];

    try {
      const projects = JSON.parse(stored) as Array<{
        path: string;
        name: string;
        lastOpened: string;
      }>;

      return projects
        .map(p => ({
          ...p,
          lastOpened: new Date(p.lastOpened),
        }))
        .sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
        .slice(0, MAX_RECENT_PROJECTS);
    } catch {
      return [];
    }
  }

  /**
   * Close current project.
   */
  async closeCurrentProject(): Promise<void> {
    await closeDatabase();
    RepositoryFactory.reset();
  }

  /**
   * Backup current database to specified location.
   */
  async backupDatabase(destinationPath: string): Promise<{ success: boolean; error?: string }> {
    const currentPath = getCurrentDatabasePath();
    if (!currentPath) {
      return { success: false, error: 'No project is currently open.' };
    }

    try {
      await copyFile(currentPath, destinationPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private addToRecentProjects(project: RecentProject): void {
    const recent = this.getRecentProjects();

    // Remove if already exists (will re-add at front)
    const filtered = recent.filter(p => p.path !== project.path);

    // Add to front
    filtered.unshift(project);

    // Keep only MAX_RECENT
    const limited = filtered.slice(0, MAX_RECENT_PROJECTS);

    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(limited));
  }

  private removeFromRecentProjects(dbPath: string): void {
    const recent = this.getRecentProjects();
    const filtered = recent.filter(p => p.path !== dbPath);
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));
  }
}

// Export singleton instance
export const projectService = new ProjectService();
