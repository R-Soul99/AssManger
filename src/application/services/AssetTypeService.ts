import { AssetType, CustomFieldDefinition, validateCustomFieldDefinition } from '../../domain/entities';
import { IAssetTypeRepository } from '../../infrastructure/repositories/interfaces';

export class AssetTypeService {
  constructor(private readonly repository: IAssetTypeRepository) {}

  // Asset Type operations
  async getAllAssetTypes(): Promise<AssetType[]> {
    return this.repository.findAll();
  }

  async getAssetTypeById(id: string): Promise<AssetType | null> {
    return this.repository.findById(id);
  }

  async getAssetTypeByName(name: string): Promise<AssetType | null> {
    return this.repository.findByName(name);
  }

  async getSystemAssetTypes(): Promise<AssetType[]> {
    const allTypes = await this.repository.findAll();
    return allTypes.filter((type) => type.isSystemType);
  }

  async createAssetType(
    assetType: Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AssetType> {
    // Validate that name doesn't already exist
    const existing = await this.repository.findByName(assetType.name);
    if (existing) {
      throw new Error(`Asset type with name "${assetType.name}" already exists`);
    }

    return this.repository.create(assetType);
  }

  async updateAssetType(
    id: string,
    data: Partial<Omit<AssetType, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AssetType | null> {
    // Check if asset type exists
    const assetType = await this.repository.findById(id);
    if (!assetType) {
      return null;
    }

    // Prevent updating system types to non-system types
    if (assetType.isSystemType && data.isSystemType === false) {
      throw new Error('Cannot change system asset types to non-system types');
    }

    // Validate name uniqueness if name is being updated
    if (data.name && data.name !== assetType.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing) {
        throw new Error(`Asset type with name "${data.name}" already exists`);
      }
    }

    return this.repository.update(id, data);
  }

  async deleteAssetType(id: string): Promise<void> {
    // Check if asset type exists and is not a system type
    const assetType = await this.repository.findById(id);
    if (!assetType) {
      throw new Error('Asset type not found');
    }

    if (assetType.isSystemType) {
      throw new Error('Cannot delete system asset types');
    }

    await this.repository.delete(id);
  }

  // Custom Field Definition operations
  async getCustomFieldDefinitions(assetTypeId: string): Promise<CustomFieldDefinition[]> {
    return this.repository.findCustomFieldDefinitions(assetTypeId);
  }

  async createCustomFieldDefinition(
    definition: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomFieldDefinition> {
    // Validate the definition
    const validation = validateCustomFieldDefinition(definition);
    if (!validation.valid) {
      throw new Error(`Invalid custom field definition: ${validation.errors.join(', ')}`);
    }

    // Check if field name already exists for this asset type
    const existing = await this.repository.findCustomFieldDefinitions(definition.assetTypeId);
    const duplicate = existing.find((field) => field.fieldName === definition.fieldName);
    if (duplicate) {
      throw new Error(
        `Custom field "${definition.fieldName}" already exists for this asset type`
      );
    }

    return this.repository.createCustomFieldDefinition(definition);
  }

  async updateCustomFieldDefinition(
    id: string,
    data: Partial<Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<CustomFieldDefinition | null> {
    // Validate if provided
    if (Object.keys(data).length > 0) {
      const validation = validateCustomFieldDefinition(data);
      if (!validation.valid) {
        throw new Error(`Invalid custom field definition: ${validation.errors.join(', ')}`);
      }
    }

    return this.repository.updateCustomFieldDefinition(id, data);
  }

  async deleteCustomFieldDefinition(id: string): Promise<void> {
    await this.repository.deleteCustomFieldDefinition(id);
  }

  /**
   * Validates a custom field value against its definition
   */
  validateCustomFieldValue(definition: CustomFieldDefinition, value: any): boolean {
    // Check required fields
    if (definition.required && (value === null || value === undefined || value === '')) {
      return false;
    }

    // If value is null/undefined and not required, it's valid
    if (value === null || value === undefined) {
      return true;
    }

    // Type-specific validation
    switch (definition.fieldType) {
      case 'text':
      case 'link':
        return typeof value === 'string';

      case 'number':
        return typeof value === 'number' && !isNaN(value);

      case 'date':
        // Accept Date objects or valid date strings
        if (value instanceof Date) {
          return !isNaN(value.getTime());
        }
        if (typeof value === 'string') {
          const date = new Date(value);
          return !isNaN(date.getTime());
        }
        return false;

      case 'checkbox':
        return typeof value === 'boolean';

      case 'dropdown':
        // Value must be in the dropdown options
        return (
          typeof value === 'string' &&
          definition.dropdownOptions.includes(value)
        );

      default:
        return false;
    }
  }
}
