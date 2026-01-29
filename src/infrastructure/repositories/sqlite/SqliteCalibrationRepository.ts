import { eq, count } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { ICalibrationRepository } from '../interfaces/ICalibrationRepository';
import { Calibration } from '@/domain/entities';
import { CalibrationData } from '@/domain/validators';
import { calibrations } from '@/infrastructure/database/schema';
import * as schema from '@/infrastructure/database/schema';

export class SqliteCalibrationRepository implements ICalibrationRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async findByFloorPlan(floorPlanId: string): Promise<Calibration | null> {
    const rows = await this.db
      .select()
      .from(calibrations)
      .where(eq(calibrations.floorPlanId, floorPlanId))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async save(calibration: CalibrationData): Promise<void> {
    await this.db.insert(calibrations).values({
      id: calibration.id,
      floorPlanId: calibration.floorPlanId,
      point1X: calibration.point1X,
      point1Y: calibration.point1Y,
      point2X: calibration.point2X,
      point2Y: calibration.point2Y,
      realWorldDistance: calibration.realWorldDistance,
      units: calibration.units,
      scale: calibration.scale,
      createdAt: calibration.createdAt,
      updatedAt: calibration.updatedAt,
    });
  }

  async update(id: string, data: Partial<CalibrationData>): Promise<void> {
    await this.db
      .update(calibrations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(calibrations.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(calibrations).where(eq(calibrations.id, id));
  }

  async deleteByFloorPlan(floorPlanId: string): Promise<void> {
    await this.db.delete(calibrations).where(eq(calibrations.floorPlanId, floorPlanId));
  }

  async isFloorPlanCalibrated(floorPlanId: string): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(calibrations)
      .where(eq(calibrations.floorPlanId, floorPlanId));

    return result[0].count > 0;
  }

  private mapRowToEntity(row: any): Calibration {
    const result = Calibration.create({
      id: row.id,
      floorPlanId: row.floorPlanId,
      point1X: row.point1X,
      point1Y: row.point1Y,
      point2X: row.point2X,
      point2Y: row.point2Y,
      realWorldDistance: row.realWorldDistance,
      units: row.units,
      scale: row.scale,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    if (!result.success) {
      throw new Error(`Failed to map database row to Calibration: ${result.errors.join(', ')}`);
    }

    return result.entity;
  }
}
