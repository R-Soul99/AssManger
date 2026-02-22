/**
 * AssetType domain entity
 * Replaces the Category concept with clearer terminology for spatial context
 */
export interface AssetType {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  isSystemType: boolean; // true for built-in types, false for user-created custom types
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CustomFieldDefinition interface
 * Defines custom fields for asset types
 * Part of AssetType's flexible schema system
 */
export interface CustomFieldDefinition {
  id: string;
  assetTypeId: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'link';
  required: boolean;
  dropdownOptions: string[]; // Used only when fieldType is 'dropdown'
  defaultValue: string | number | boolean | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation for CustomFieldDefinition
 */
export function validateCustomFieldDefinition(
  definition: Partial<CustomFieldDefinition>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!definition.fieldName || definition.fieldName.trim().length === 0) {
    errors.push('fieldName is required');
  }

  const validFieldTypes = ['text', 'number', 'date', 'dropdown', 'checkbox', 'link'];
  if (!definition.fieldType || !validFieldTypes.includes(definition.fieldType)) {
    errors.push(`fieldType must be one of: ${validFieldTypes.join(', ')}`);
  }

  if (definition.fieldType === 'dropdown') {
    if (!definition.dropdownOptions || definition.dropdownOptions.length === 0) {
      errors.push('dropdownOptions is required when fieldType is dropdown');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
