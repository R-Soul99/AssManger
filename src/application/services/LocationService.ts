import { v4 as uuidv4 } from 'uuid';
import { ILocationRepository } from '@/infrastructure/repositories/interfaces';
import { Location } from '@/domain/entities';
import { LocationType, LocationData } from '@/domain/validators';

export interface CreateLocationDto {
  name: string;
  type: LocationType;
  parentId: string | null;
  description?: string;
}

export interface MoveLocationDto {
  locationId: string;
  newParentId: string | null;
}

export type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Service for managing location hierarchy with integrity rules.
 *
 * Enforces:
 * - Hierarchy: Site > Building > Floor > Room
 * - Cannot delete location with children
 * - Cannot delete location with assets
 * - Parent type must be compatible with child type
 */
export class LocationService {
  constructor(private locationRepository: ILocationRepository) {}

  /**
   * Create a new location with parent type validation.
   */
  async createLocation(dto: CreateLocationDto): Promise<ServiceResult<Location>> {
    try {
      // Validate parent compatibility if parent exists
      if (dto.parentId) {
        const parent = await this.locationRepository.findById(dto.parentId);
        if (!parent) {
          return { success: false, error: `Parent location not found: ${dto.parentId}` };
        }

        if (!parent.canHaveChildType(dto.type)) {
          return {
            success: false,
            error: `Invalid hierarchy: ${parent.type} cannot have ${dto.type} as child. Expected: ${this.getExpectedChildType(parent.type)}`,
          };
        }
      } else {
        // No parent - must be a site
        if (dto.type !== 'site') {
          return {
            success: false,
            error: `Only 'site' locations can have no parent. Got: ${dto.type}`,
          };
        }
      }

      // Create location entity
      const locationData: LocationData = {
        id: uuidv4(),
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId,
        description: dto.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = Location.create(locationData);
      if (!result.success) {
        return { success: false, error: result.errors.join(', ') };
      }

      // Persist to database
      await this.locationRepository.save(locationData);

      return { success: true, data: result.entity };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create location: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Delete location with integrity checks.
   * Prevents deletion if location has children or assets.
   */
  async deleteLocation(id: string): Promise<ServiceResult> {
    try {
      const location = await this.locationRepository.findById(id);
      if (!location) {
        return { success: false, error: `Location not found: ${id}` };
      }

      // Check for children
      const hasChildren = await this.locationRepository.hasChildren(id);
      if (hasChildren) {
        return {
          success: false,
          error: `Cannot delete location '${location.name}': it has child locations. Delete children first.`,
        };
      }

      // Check for assets
      const hasAssets = await this.locationRepository.hasAssets(id);
      if (hasAssets) {
        return {
          success: false,
          error: `Cannot delete location '${location.name}': it has assets assigned. Move or delete assets first.`,
        };
      }

      // Safe to delete
      await this.locationRepository.delete(id);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete location: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Move location to new parent with hierarchy validation.
   */
  async moveLocation(dto: MoveLocationDto): Promise<ServiceResult> {
    try {
      const location = await this.locationRepository.findById(dto.locationId);
      if (!location) {
        return { success: false, error: `Location not found: ${dto.locationId}` };
      }

      // Validate new parent if provided
      if (dto.newParentId) {
        const newParent = await this.locationRepository.findById(dto.newParentId);
        if (!newParent) {
          return { success: false, error: `New parent location not found: ${dto.newParentId}` };
        }

        // Check if new parent can have this type of child
        if (!newParent.canHaveChildType(location.type)) {
          return {
            success: false,
            error: `Invalid hierarchy: ${newParent.type} cannot have ${location.type} as child. Expected: ${this.getExpectedChildType(newParent.type)}`,
          };
        }

        // Prevent moving location under itself or its descendants
        const isDescendant = await this.isDescendantOf(dto.newParentId, dto.locationId);
        if (isDescendant || dto.newParentId === dto.locationId) {
          return {
            success: false,
            error: `Cannot move location under itself or its descendants`,
          };
        }
      } else {
        // Moving to root - must be a site
        if (location.type !== 'site') {
          return {
            success: false,
            error: `Only 'site' locations can be at root level. Got: ${location.type}`,
          };
        }
      }

      // Update parent
      await this.locationRepository.update(dto.locationId, {
        parentId: dto.newParentId,
        updatedAt: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to move location: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get all root locations (sites).
   */
  async getRootLocations(): Promise<ServiceResult<Location[]>> {
    try {
      const roots = await this.locationRepository.findRoots();
      return { success: true, data: roots };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get root locations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get children of a location.
   */
  async getChildren(parentId: string): Promise<ServiceResult<Location[]>> {
    try {
      const children = await this.locationRepository.findChildren(parentId);
      return { success: true, data: children };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get children: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get location by ID.
   */
  async getLocationById(id: string): Promise<ServiceResult<Location>> {
    try {
      const location = await this.locationRepository.findById(id);
      if (!location) {
        return { success: false, error: `Location not found: ${id}` };
      }
      return { success: true, data: location };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get location: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update location details (not parent).
   */
  async updateLocation(
    id: string,
    updates: { name?: string; description?: string }
  ): Promise<ServiceResult> {
    try {
      const location = await this.locationRepository.findById(id);
      if (!location) {
        return { success: false, error: `Location not found: ${id}` };
      }

      await this.locationRepository.update(id, {
        ...updates,
        updatedAt: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update location: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if potentialDescendantId is a descendant of ancestorId.
   */
  private async isDescendantOf(potentialDescendantId: string, ancestorId: string): Promise<boolean> {
    let current = await this.locationRepository.findById(potentialDescendantId);

    while (current && current.parentId) {
      if (current.parentId === ancestorId) {
        return true;
      }
      current = await this.locationRepository.findById(current.parentId);
    }

    return false;
  }

  /**
   * Get expected child type for a parent type.
   */
  private getExpectedChildType(parentType: LocationType): string {
    const hierarchy: Record<LocationType, string> = {
      site: 'building',
      building: 'floor',
      floor: 'room',
      room: 'none (rooms cannot have children)',
    };
    return hierarchy[parentType];
  }
}
