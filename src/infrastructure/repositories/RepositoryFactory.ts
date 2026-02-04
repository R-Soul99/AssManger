import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../database/schema';
import { getDatabase } from '../database/connection';
import {
  ILocationRepository,
  IAssetRepository,
  IFloorPlanRepository,
  IMarkerRepository,
  ICalibrationRepository,
  ICategoryRepository,
} from './interfaces';
import {
  SqliteLocationRepository,
  SqliteAssetRepository,
  SqliteFloorPlanRepository,
  SqliteMarkerRepository,
  SqliteCalibrationRepository,
  SqliteCategoryRepository,
} from './sqlite';
import { MockCategoryRepository, MockLocationRepository, MockAssetRepository } from './mock';

/**
 * Factory for creating repository instances.
 * Uses the current database connection.
 * Future: Can be extended to support PostgreSQL repositories.
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;

  private locationRepo: ILocationRepository | null = null;
  private assetRepo: IAssetRepository | null = null;
  private floorPlanRepo: IFloorPlanRepository | null = null;
  private markerRepo: IMarkerRepository | null = null;
  private calibrationRepo: ICalibrationRepository | null = null;
  private categoryRepo: ICategoryRepository | null = null;

  private constructor(private db: BetterSQLite3Database<typeof schema> | null) {}

  static getInstance(): RepositoryFactory {
    if (!this.instance) {
      let db: BetterSQLite3Database<typeof schema> | null = null;
      try {
        db = getDatabase();
      } catch {
        // Database unavailable (e.g. WebView without native addon) — mock repos used below
      }
      this.instance = new RepositoryFactory(db);
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }

  getLocationRepository(): ILocationRepository {
    if (!this.locationRepo) {
      this.locationRepo = this.db ? new SqliteLocationRepository(this.db) : new MockLocationRepository();
    }
    return this.locationRepo;
  }

  getAssetRepository(): IAssetRepository {
    if (!this.assetRepo) {
      this.assetRepo = this.db ? new SqliteAssetRepository(this.db) : new MockAssetRepository();
    }
    return this.assetRepo;
  }

  getFloorPlanRepository(): IFloorPlanRepository {
    if (!this.db) throw new Error('FloorPlanRepository requires a database connection');
    if (!this.floorPlanRepo) {
      this.floorPlanRepo = new SqliteFloorPlanRepository(this.db);
    }
    return this.floorPlanRepo;
  }

  getMarkerRepository(): IMarkerRepository {
    if (!this.db) throw new Error('MarkerRepository requires a database connection');
    if (!this.markerRepo) {
      this.markerRepo = new SqliteMarkerRepository(this.db);
    }
    return this.markerRepo;
  }

  getCalibrationRepository(): ICalibrationRepository {
    if (!this.db) throw new Error('CalibrationRepository requires a database connection');
    if (!this.calibrationRepo) {
      this.calibrationRepo = new SqliteCalibrationRepository(this.db);
    }
    return this.calibrationRepo;
  }

  getCategoryRepository(): ICategoryRepository {
    if (!this.categoryRepo) {
      this.categoryRepo = this.db ? new SqliteCategoryRepository(this.db) : new MockCategoryRepository();
    }
    return this.categoryRepo;
  }
}
