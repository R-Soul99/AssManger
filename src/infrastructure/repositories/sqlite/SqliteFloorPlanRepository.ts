import { eq, isNull, asc, count } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { IFloorPlanRepository } from '../interfaces/IFloorPlanRepository';
import { FloorPlan } from '@/domain/entities';
import { FloorPlanData } from '@/domain/validators';
import { floorPlans, markers } from '@/infrastructure/database/schema';
import * as schema from '@/infrastructure/database/schema';

export class SqliteFloorPlanRepository implements IFloorPlanRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async findById(id: string): Promise<FloorPlan | null> {
    const rows = await this.db
      .select()
      .from(floorPlans)
      .where(eq(floorPlans.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findAll(): Promise<FloorPlan[]> {
    const rows = await this.db.select().from(floorPlans);
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByLocation(locationId: string): Promise<FloorPlan[]> {
    const rows = await this.db
      .select()
      .from(floorPlans)
      .where(eq(floorPlans.locationId, locationId))
      .orderBy(asc(floorPlans.displayOrder), asc(floorPlans.createdAt));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async findUnassigned(): Promise<FloorPlan[]> {
    const rows = await this.db
      .select()
      .from(floorPlans)
      .where(isNull(floorPlans.locationId))
      .orderBy(asc(floorPlans.createdAt));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async save(floorPlan: FloorPlanData): Promise<void> {
    await this.db.insert(floorPlans).values({
      id: floorPlan.id,
      name: floorPlan.name,
      locationId: floorPlan.locationId,
      imageRelativePath: floorPlan.imageRelativePath,
      imageWidth: floorPlan.imageWidth,
      imageHeight: floorPlan.imageHeight,
      displayOrder: floorPlan.displayOrder ?? 0,
      createdAt: floorPlan.createdAt,
      updatedAt: floorPlan.updatedAt,
    });
  }

  async update(id: string, data: Partial<FloorPlanData>): Promise<void> {
    await this.db
      .update(floorPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(floorPlans.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(floorPlans).where(eq(floorPlans.id, id));
  }

  async hasMarkers(id: string): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(markers)
      .where(eq(markers.floorPlanId, id));

    return result[0].count > 0;
  }

  async getMarkerCount(id: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(markers)
      .where(eq(markers.floorPlanId, id));

    return result[0].count;
  }

  async reorder(_locationId: string, orderedIds: string[]): Promise<void> {
    // Sequential updates for SQLite write safety
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db
        .update(floorPlans)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(eq(floorPlans.id, orderedIds[i]));
    }
  }

  private mapRowToEntity(row: any): FloorPlan {
    const result = FloorPlan.create({
      id: row.id,
      name: row.name,
      locationId: row.locationId,
      imageRelativePath: row.imageRelativePath,
      imageWidth: row.imageWidth,
      imageHeight: row.imageHeight,
      displayOrder: row.displayOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    if (!result.success) {
      throw new Error('Failed to map database row to FloorPlan: ' + result.errors.join(', '));
    }

    return result.entity;
  }
}
