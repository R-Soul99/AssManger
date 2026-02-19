import { v4 as uuidv4 } from 'uuid';
import { IAssetRepository, AssetWithRelations, AssetFilters } from '@/infrastructure/repositories/interfaces';
import { Asset } from '@/domain/entities';
import { AssetData } from '@/domain/validators';

export interface CreateAssetDto {
  tag: string;
  description: string;
  categoryId: number;
  locationId?: string;
  serialNumber?: string;
  phoneExtension?: string;
  status?: 'active' | 'pending' | 'decommissioned' | 'faulty' | 'maintenance';
  owner?: string;
  costCentre?: string;
  notes?: string;
  cost?: number;
  purchaseDate?: Date;
}

export interface UpdateAssetDto {
  tag?: string;
  description?: string;
  categoryId?: number;
  locationId?: string;
  serialNumber?: string;
  phoneExtension?: string;
  status?: 'active' | 'pending' | 'decommissioned' | 'faulty' | 'maintenance';
  owner?: string;
  costCentre?: string;
  notes?: string;
  cost?: number;
  purchaseDate?: Date;
}

export type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Service for managing assets with validation and business rules.
 *
 * Enforces:
 * - Unique asset tags
 * - Valid category and location references
 * - Tag format validation
 */
export class AssetService {
  constructor(private assetRepository: IAssetRepository) {}

  /**
   * Create a new asset with tag uniqueness validation.
   */
  async createAsset(dto: CreateAssetDto): Promise<ServiceResult<Asset>> {
    try {
      // Check tag uniqueness
      const tagExists = await this.assetRepository.tagExists(dto.tag);
      if (tagExists) {
        return { success: false, error: `Asset tag '${dto.tag}' already exists` };
      }

      // Create asset entity
      const assetData: AssetData = {
        id: uuidv4(),
        tag: dto.tag,
        description: dto.description,
        categoryId: dto.categoryId,
        locationId: dto.locationId ?? '',
        serialNumber: dto.serialNumber,
        phoneExtension: dto.phoneExtension,
        status: dto.status || 'active',
        owner: dto.owner,
        costCentre: dto.costCentre,
        notes: dto.notes,
        cost: dto.cost,
        purchaseDate: dto.purchaseDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = Asset.create(assetData);
      if (!result.success) {
        return { success: false, error: result.errors.join(', ') };
      }

      // Persist to database
      await this.assetRepository.save(assetData);

      return { success: true, data: result.entity };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create asset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update an existing asset.
   */
  async updateAsset(id: string, dto: UpdateAssetDto): Promise<ServiceResult> {
    try {
      const asset = await this.assetRepository.findById(id);
      if (!asset) {
        return { success: false, error: `Asset not found: ${id}` };
      }

      // Check tag uniqueness if tag is being changed
      if (dto.tag && dto.tag !== asset.tag) {
        const tagExists = await this.assetRepository.tagExists(dto.tag, id);
        if (tagExists) {
          return { success: false, error: `Asset tag '${dto.tag}' already exists` };
        }
      }

      await this.assetRepository.update(id, {
        ...dto,
        updatedAt: new Date(),
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Delete an asset.
   */
  async deleteAsset(id: string): Promise<ServiceResult> {
    try {
      const asset = await this.assetRepository.findById(id);
      if (!asset) {
        return { success: false, error: `Asset not found: ${id}` };
      }

      await this.assetRepository.delete(id);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get all assets with their category and location information.
   */
  async getAssetsWithRelations(filters?: AssetFilters): Promise<ServiceResult<AssetWithRelations[]>> {
    try {
      const assets = await this.assetRepository.findAllWithRelations(filters);
      return { success: true, data: assets };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get assets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get asset by ID.
   */
  async getAssetById(id: string): Promise<ServiceResult<Asset>> {
    try {
      const asset = await this.assetRepository.findById(id);
      if (!asset) {
        return { success: false, error: `Asset not found: ${id}` };
      }
      return { success: true, data: asset };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get asset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
