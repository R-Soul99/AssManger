import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { IMarkerRepository } from '../interfaces/IMarkerRepository';
import { Marker } from '@/domain/entities';
import { MarkerData } from '@/domain/validators';
import { markers } from '@/infrastructure/database/schema';
import * as schema from '@/infrastructure/database/schema';

export class SqliteMarkerRepository implements IMarkerRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async findById(id: string): Promise<Marker | null> {
    const rows = await this.db
      .select()
      .from(markers)
      .where(eq(markers.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findByFloorPlan(floorPlanId: string): Promise<Marker[]> {
    const rows = await this.db
      .select()
      .from(markers)
      .where(eq(markers.floorPlanId, floorPlanId));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByAsset(assetId: string): Promise<Marker[]> {
    const rows = await this.db
      .select()
      .from(markers)
      .where(eq(markers.assetId, assetId));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async save(marker: MarkerData): Promise<void> {
    await this.db.insert(markers).values({
      id: marker.id,
      floorPlanId: marker.floorPlanId,
      assetId: marker.assetId,
      normalizedX: marker.normalizedX,
      normalizedY: marker.normalizedY,
      createdAt: marker.createdAt,
      updatedAt: marker.updatedAt,
    });
  }

  async update(id: string, data: Partial<MarkerData>): Promise<void> {
    await this.db
      .update(markers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(markers.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(markers).where(eq(markers.id, id));
  }

  async deleteByFloorPlan(floorPlanId: string): Promise<void> {
    await this.db.delete(markers).where(eq(markers.floorPlanId, floorPlanId));
  }

  async deleteByAsset(assetId: string): Promise<void> {
    await this.db.delete(markers).where(eq(markers.assetId, assetId));
  }

  private mapRowToEntity(row: any): Marker {
    const result = Marker.create({
      id: row.id,
      floorPlanId: row.floorPlanId,
      assetId: row.assetId,
      normalizedX: row.normalizedX,
      normalizedY: row.normalizedY,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    if (!result.success) {
      throw new Error(`Failed to map database row to Marker: ${result.errors.join(', ')}`);
    }

    return result.entity;
  }
}
