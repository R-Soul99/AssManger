import { v4 as uuidv4 } from 'uuid';
import { Marker, Asset, Category } from '@/domain/entities';
import { MarkerData } from '@/domain/validators';
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
  private get markerRepository(): IMarkerRepository {
    return RepositoryFactory.getInstance().getMarkerRepository();
  }

  private get assetRepository(): IAssetRepository {
    return RepositoryFactory.getInstance().getAssetRepository();
  }

  private get categoryRepository(): ICategoryRepository {
    return RepositoryFactory.getInstance().getCategoryRepository();
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
   * Place a new marker on a floor plan at the given normalized coordinates.
   *
   * Coordinates are clamped to the 0.0-1.0 range before saving.
   *
   * @param floorPlanId - Floor plan to place the marker on
   * @param assetId - Asset the marker represents
   * @param normalizedX - Horizontal position (0.0 = left, 1.0 = right)
   * @param normalizedY - Vertical position (0.0 = top, 1.0 = bottom)
   * @returns The newly created Marker entity
   */
  async placeMarker(
    floorPlanId: string,
    assetId: string,
    normalizedX: number,
    normalizedY: number
  ): Promise<Marker> {
    const now = new Date();
    const markerData: MarkerData = {
      id: uuidv4(),
      floorPlanId,
      assetId,
      normalizedX: Math.max(0, Math.min(1, normalizedX)),
      normalizedY: Math.max(0, Math.min(1, normalizedY)),
      createdAt: now,
      updatedAt: now,
    };

    const result = Marker.create(markerData);
    if (!result.success) {
      throw new Error(result.errors.join(', '));
    }

    await this.markerRepository.save(markerData);
    return result.entity;
  }

  /**
   * Move an existing marker to a new position on the floor plan.
   *
   * Coordinates are clamped to the 0.0-1.0 range before saving.
   *
   * @param markerId - ID of the marker to move
   * @param normalizedX - New horizontal position (0.0-1.0)
   * @param normalizedY - New vertical position (0.0-1.0)
   */
  async moveMarker(
    markerId: string,
    normalizedX: number,
    normalizedY: number
  ): Promise<void> {
    await this.markerRepository.update(markerId, {
      normalizedX: Math.max(0, Math.min(1, normalizedX)),
      normalizedY: Math.max(0, Math.min(1, normalizedY)),
      updatedAt: new Date(),
    });
  }

  /**
   * Delete a marker from the database.
   *
   * @param markerId - ID of the marker to delete
   */
  async deleteMarker(markerId: string): Promise<void> {
    await this.markerRepository.delete(markerId);
  }

  /**
   * Relink a marker to a different asset.
   *
   * @param markerId - ID of the marker to update
   * @param newAssetId - ID of the asset to link the marker to
   */
  async relinkMarker(markerId: string, newAssetId: string): Promise<void> {
    await this.markerRepository.update(markerId, {
      assetId: newAssetId,
      updatedAt: new Date(),
    });
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
