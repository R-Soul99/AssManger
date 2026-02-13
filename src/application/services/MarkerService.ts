import { Marker, Asset, Category } from '@/domain/entities';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { IMarkerRepository, IAssetRepository, ICategoryRepository } from '@/infrastructure/repositories/interfaces';

/**
 * Enriched marker data with associated asset and category information.
 */
export interface MarkerWithDetails {
  marker: Marker;
  asset: Asset;
  category: Category;
}

/**
 * Service for fetching markers with enriched asset and category data.
 *
 * Provides marker visualization data by joining markers with their
 * associated assets and categories, enabling category-specific styling.
 */
export class MarkerService {
  private markerRepository: IMarkerRepository;
  private assetRepository: IAssetRepository;
  private categoryRepository: ICategoryRepository;

  constructor() {
    const factory = RepositoryFactory.getInstance();
    this.markerRepository = factory.getMarkerRepository();
    this.assetRepository = factory.getAssetRepository();
    this.categoryRepository = factory.getCategoryRepository();
  }

  /**
   * Get all markers for a floor plan with enriched asset and category data.
   *
   * @param floorPlanId - Floor plan ID to fetch markers for
   * @returns Array of markers with associated asset and category details
   *
   * Missing data handling:
   * - Markers without valid assets are skipped (logged as warning)
   * - Assets without valid categories use default "Uncategorized" category
   */
  async getMarkersWithDetails(floorPlanId: string): Promise<MarkerWithDetails[]> {
    try {
      // Fetch all markers for the floor plan
      const markers = await this.markerRepository.findByFloorPlan(floorPlanId);

      if (markers.length === 0) {
        return [];
      }

      // Fetch asset and category data for each marker in parallel
      const enrichedMarkers = await Promise.all(
        markers.map(async (marker) => {
          try {
            // Fetch associated asset
            const asset = await this.assetRepository.findById(marker.assetId);

            if (!asset) {
              console.warn(
                `[MarkerService] Marker ${marker.id} references non-existent asset ${marker.assetId}, skipping`
              );
              return null;
            }

            // Fetch asset's category
            let category = await this.categoryRepository.findById(asset.categoryId);

            // Use default category if category not found
            if (!category) {
              console.warn(
                `[MarkerService] Asset ${asset.id} references non-existent category ${asset.categoryId}, using default`
              );
              category = this.getDefaultCategory();
            }

            return {
              marker,
              asset,
              category,
            };
          } catch (error) {
            console.error(
              `[MarkerService] Error enriching marker ${marker.id}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out null entries (markers with missing assets)
      return enrichedMarkers.filter(
        (item): item is MarkerWithDetails => item !== null
      );
    } catch (error) {
      console.error('[MarkerService] Error fetching markers with details:', error);
      throw error;
    }
  }

  /**
   * Get default category for assets with missing category references.
   */
  private getDefaultCategory(): Category {
    return {
      id: 0,
      name: 'Uncategorized',
      parentId: null,
      description: 'Default category for assets without a valid category',
      icon: 'help',
      color: '#999999',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Export singleton instance
export const markerService = new MarkerService();
