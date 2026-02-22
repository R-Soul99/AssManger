import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { AssetType, CustomFieldDefinition } from '../../../domain/entities';
import { IAssetTypeRepository } from '../interfaces';
import * as schema from '../../database/schema';
import { assetTypes, customFieldDefinitions } from '../../database/schema';
import { v4 as uuidv4 } from 'uuid';

export class SqliteAssetTypeRepository implements IAssetTypeRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  async findAll(): Promise<AssetType[]> {
    const results = await this.db.select().from(assetTypes);
    return results.map(this.mapToAssetType);
  }

  async findById(id: string): Promise<AssetType | null> {
    const results = await this.db.select().from(assetTypes).where(eq(assetTypes.id, id));
    return results[0] ? this.mapToAssetType(results[0]) : null;
  }

  async findByName(name: string): Promise<AssetType | null> {
    const results = await this.db.select().from(assetTypes).where(eq(assetTypes.name, name));
    return results[0] ? this.mapToAssetType(results[0]) : null;
  }

  async create(assetType: Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssetType> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db
      .insert(assetTypes)
      .values({
        id,
        name: assetType.name,
        description: assetType.description ?? null,
        icon: assetType.icon,
        color: assetType.color,
        isSystemType: assetType.isSystemType,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapToAssetType(result[0]);
  }

  async update(
    id: string,
    data: Partial<Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AssetType | null> {
    const now = new Date();

    await this.db
      .update(assetTypes)
      .set({ ...data, updatedAt: now })
      .where(eq(assetTypes.id, id));

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(assetTypes).where(eq(assetTypes.id, id));
  }

  // Custom Field Definition operations
  async findCustomFieldDefinitions(assetTypeId: string): Promise<CustomFieldDefinition[]> {
    const results = await this.db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.assetTypeId, assetTypeId));

    return results.map(this.mapToCustomFieldDefinition);
  }

  async createCustomFieldDefinition(
    definition: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomFieldDefinition> {
    const id = uuidv4();
    const now = new Date();

    const result = await this.db
      .insert(customFieldDefinitions)
      .values({
        id,
        assetTypeId: definition.assetTypeId,
        fieldName: definition.fieldName,
        fieldType: definition.fieldType,
        required: definition.required,
        dropdownOptions: JSON.stringify(definition.dropdownOptions),
        defaultValue: definition.defaultValue !== null ? JSON.stringify(definition.defaultValue) : null,
        displayOrder: definition.displayOrder,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapToCustomFieldDefinition(result[0]);
  }

  async updateCustomFieldDefinition(
    id: string,
    data: Partial<Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CustomFieldDefinition | null> {
    const now = new Date();

    // Prepare update data with JSON serialization
    const updateData: any = { ...data, updatedAt: now };
    if (data.dropdownOptions !== undefined) {
      updateData.dropdownOptions = JSON.stringify(data.dropdownOptions);
    }
    if (data.defaultValue !== undefined) {
      updateData.defaultValue = data.defaultValue !== null ? JSON.stringify(data.defaultValue) : null;
    }

    await this.db
      .update(customFieldDefinitions)
      .set(updateData)
      .where(eq(customFieldDefinitions.id, id));

    // Fetch and return the updated definition
    const results = await this.db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.id, id));

    return results[0] ? this.mapToCustomFieldDefinition(results[0]) : null;
  }

  async deleteCustomFieldDefinition(id: string): Promise<void> {
    await this.db.delete(customFieldDefinitions).where(eq(customFieldDefinitions.id, id));
  }

  // Helper methods for mapping database rows to domain entities
  private mapToAssetType(row: any): AssetType {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      isSystemType: Boolean(row.isSystemType),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  private mapToCustomFieldDefinition(row: any): CustomFieldDefinition {
    return {
      id: row.id,
      assetTypeId: row.assetTypeId,
      fieldName: row.fieldName,
      fieldType: row.fieldType as CustomFieldDefinition['fieldType'],
      required: Boolean(row.required),
      dropdownOptions: row.dropdownOptions ? JSON.parse(row.dropdownOptions) : [],
      defaultValue: row.defaultValue ? JSON.parse(row.defaultValue) : null,
      displayOrder: row.displayOrder,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
