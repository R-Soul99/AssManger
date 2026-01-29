import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../database/schema';
import { getDatabase } from '../database/connection';
import {
  ILocationRepository,
  IAssetRepository,
  IFloorPlanRepository,
  IMarkerRepository,
  ICalibrationRepository,
} from './interfaces';
import {
  SqliteLocationRepository,
  SqliteAssetRepository,
  SqliteFloorPlanRepository,
  SqliteMarkerRepository,
  SqliteCalibrationRepository,
} from './sqlite';

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

  private constructor(private db: BetterSQLite3Database<typeof schema>) {}

  static getInstance(): RepositoryFactory {
    if (!this.instance) {
      this.instance = new RepositoryFactory(getDatabase());
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }

  getLocationRepository(): ILocationRepository {
    if (!this.locationRepo) {
      this.locationRepo = new SqliteLocationRepository(this.db);
    }
    return this.locationRepo;
  }

  getAssetRepository(): IAssetRepository {
    if (!this.assetRepo) {
      this.assetRepo = new SqliteAssetRepository(this.db);
    }
    return this.assetRepo;
  }

  getFloorPlanRepository(): IFloorPlanRepository {
    if (!this.floorPlanRepo) {
      this.floorPlanRepo = new SqliteFloorPlanRepository(this.db);
    }
    return this.floorPlanRepo;
  }

  getMarkerRepository(): IMarkerRepository {
    if (!this.markerRepo) {
      this.markerRepo = new SqliteMarkerRepository(this.db);
    }
    return this.markerRepo;
  }

  getCalibrationRepository(): ICalibrationRepository {
    if (!this.calibrationRepo) {
      this.calibrationRepo = new SqliteCalibrationRepository(this.db);
    }
    return this.calibrationRepo;
  }
}
