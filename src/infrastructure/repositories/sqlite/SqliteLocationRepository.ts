import { eq, isNull, count } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { ILocationRepository } from '../interfaces/ILocationRepository';
import { Location } from '@/domain/entities';
import { LocationData, LocationType } from '@/domain/validators';
import { locations, assets } from '@/infrastructure/database/schema';
import * as schema from '@/infrastructure/database/schema';

export class SqliteLocationRepository implements ILocationRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async findById(id: string): Promise<Location | null> {
    const rows = await this.db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findAll(): Promise<Location[]> {
    const rows = await this.db.select().from(locations);
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByType(type: LocationType): Promise<Location[]> {
    const rows = await this.db
      .select()
      .from(locations)
      .where(eq(locations.type, type));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async findChildren(parentId: string): Promise<Location[]> {
    const rows = await this.db
      .select()
      .from(locations)
      .where(eq(locations.parentId, parentId));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async findRoots(): Promise<Location[]> {
    const rows = await this.db
      .select()
      .from(locations)
      .where(isNull(locations.parentId));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async save(location: LocationData): Promise<void> {
    await this.db.insert(locations).values({
      id: location.id,
      name: location.name,
      type: location.type,
      parentId: location.parentId ?? null,
      description: location.description ?? null,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    });
  }

  async update(id: string, data: Partial<LocationData>): Promise<void> {
    await this.db
      .update(locations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(locations).where(eq(locations.id, id));
  }

  async hasChildren(id: string): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(locations)
      .where(eq(locations.parentId, id));

    return result[0].count > 0;
  }

  async hasAssets(id: string): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(assets)
      .where(eq(assets.locationId, id));

    return result[0].count > 0;
  }

  private mapRowToEntity(row: any): Location {
    const result = Location.create({
      id: row.id,
      name: row.name,
      type: row.type,
      parentId: row.parentId ?? undefined,
      description: row.description ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    if (!result.success) {
      throw new Error(`Failed to map database row to Location: ${result.errors.join(', ')}`);
    }

    return result.entity;
  }
}
