import { eq, like, or, and, ne, count } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { IAssetRepository, AssetFilters } from '../interfaces/IAssetRepository';
import { Asset } from '@/domain/entities';
import { AssetData } from '@/domain/validators';
import { assets } from '@/infrastructure/database/schema';
import * as schema from '@/infrastructure/database/schema';

export class SqliteAssetRepository implements IAssetRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  async findById(id: string): Promise<Asset | null> {
    const rows = await this.db
      .select()
      .from(assets)
      .where(eq(assets.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findAll(filters?: AssetFilters): Promise<Asset[]> {
    const conditions = [];

    if (filters) {
      if (filters.locationId) {
        conditions.push(eq(assets.locationId, filters.locationId));
      }
      if (filters.category) {
        conditions.push(eq(assets.category, filters.category));
      }
      if (filters.status) {
        conditions.push(eq(assets.status, filters.status as any));
      }
      if (filters.searchTerm) {
        const term = `%${filters.searchTerm}%`;
        conditions.push(
          or(
            like(assets.tag, term),
            like(assets.description, term),
            like(assets.serialNumber, term),
            like(assets.phoneExtension, term)
          )
        );
      }
    }

    let query = this.db.select().from(assets);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const rows = await query;
    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByLocation(locationId: string): Promise<Asset[]> {
    const rows = await this.db
      .select()
      .from(assets)
      .where(eq(assets.locationId, locationId));

    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByTag(tag: string): Promise<Asset | null> {
    const rows = await this.db
      .select()
      .from(assets)
      .where(eq(assets.tag, tag))
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async tagExists(tag: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(assets.tag, tag)];

    if (excludeId) {
      conditions.push(ne(assets.id, excludeId));
    }

    const result = await this.db
      .select({ count: count() })
      .from(assets)
      .where(and(...conditions));

    return result[0].count > 0;
  }

  async save(asset: AssetData): Promise<void> {
    await this.db.insert(assets).values({
      id: asset.id,
      tag: asset.tag,
      category: asset.category,
      description: asset.description,
      locationId: asset.locationId,
      serialNumber: asset.serialNumber ?? null,
      phoneExtension: asset.phoneExtension ?? null,
      status: asset.status,
      owner: asset.owner ?? null,
      costCentre: asset.costCentre ?? null,
      notes: asset.notes ?? null,
      cost: asset.cost ?? null,
      purchaseDate: asset.purchaseDate ?? null,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    });
  }

  async update(id: string, data: Partial<AssetData>): Promise<void> {
    await this.db
      .update(assets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(assets).where(eq(assets.id, id));
  }

  async count(filters?: AssetFilters): Promise<number> {
    const conditions = [];

    if (filters) {
      if (filters.locationId) conditions.push(eq(assets.locationId, filters.locationId));
      if (filters.category) conditions.push(eq(assets.category, filters.category));
      if (filters.status) conditions.push(eq(assets.status, filters.status as any));
      if (filters.searchTerm) {
        const term = `%${filters.searchTerm}%`;
        conditions.push(
          or(
            like(assets.tag, term),
            like(assets.description, term),
            like(assets.serialNumber, term),
            like(assets.phoneExtension, term)
          )
        );
      }
    }

    let query = this.db.select({ count: count() }).from(assets);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return result[0].count;
  }

  private mapRowToEntity(row: any): Asset {
    const result = Asset.create({
      id: row.id,
      tag: row.tag,
      category: row.category,
      description: row.description,
      locationId: row.locationId,
      serialNumber: row.serialNumber ?? undefined,
      phoneExtension: row.phoneExtension ?? undefined,
      status: row.status,
      owner: row.owner ?? undefined,
      costCentre: row.costCentre ?? undefined,
      notes: row.notes ?? undefined,
      cost: row.cost ?? undefined,
      purchaseDate: row.purchaseDate ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    if (!result.success) {
      throw new Error(`Failed to map database row to Asset: ${result.errors.join(', ')}`);
    }

    return result.entity;
  }
}
