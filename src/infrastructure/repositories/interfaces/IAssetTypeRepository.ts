import { AssetType, CustomFieldDefinition } from '../../../domain/entities';

export interface IAssetTypeRepository {
  // Asset Type operations
  findAll(): Promise<AssetType[]>;
  findById(id: string): Promise<AssetType | null>;
  findByName(name: string): Promise<AssetType | null>;
  create(assetType: Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssetType>;
  update(id: string, data: Partial<Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AssetType | null>;
  delete(id: string): Promise<void>;

  // Custom Field Definition operations
  findCustomFieldDefinitions(assetTypeId: string): Promise<CustomFieldDefinition[]>;
  createCustomFieldDefinition(
    definition: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomFieldDefinition>;
  updateCustomFieldDefinition(
    id: string,
    data: Partial<Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CustomFieldDefinition | null>;
  deleteCustomFieldDefinition(id: string): Promise<void>;
}
