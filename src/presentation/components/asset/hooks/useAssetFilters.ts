import { useState, useCallback } from 'react';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import { LocationData } from '@/domain/validators';

export interface AssetFiltersState {
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  categoryId?: number;
  status?: string;
}

export function useAssetFilters() {
  const [filters, setFilters] = useState<AssetFiltersState>({});

  const updateFilter = useCallback((key: keyof AssetFiltersState, value: string | number | undefined) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value === undefined || value === '') {
        delete newFilters[key];
      } else {
        // @ts-ignore - Dynamic key assignment
        newFilters[key] = value;
      }
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const applyFilters = useCallback((assets: AssetWithRelations[], locations: LocationData[]) => {
    return assets.filter(({ asset, location }) => {
      // Category filter
      if (filters.categoryId !== undefined && asset.categoryId !== filters.categoryId) {
        return false;
      }

      // Status filter
      if (filters.status && asset.status !== filters.status) {
        return false;
      }

      // Location hierarchy filter
      // If room is selected, exact match on locationId
      if (filters.roomId) {
        return asset.locationId === filters.roomId;
      }

      // If floor/building/site is selected, we need to check the location path
      // This is tricky because the asset stores locationId, and we may only have the leaf location.
      // However, we passed 'locations' array which contains all locations with parentIds.
      // We need to trace the asset's location up to see if it belongs to the selected filter.

      const targetLocationId = filters.floorId || filters.buildingId || filters.siteId;
      if (targetLocationId) {
        // If the asset has no location but a filter is set, exclude it
        if (!location) return false;

        // Trace up from asset's location
        let current: LocationData | undefined = location;
        let found = false;
        
        // Safety check to prevent infinite loops (though repo guarantees no cycles)
        let depth = 0;
        while (current && depth < 20) {
          if (current.id === targetLocationId) {
            found = true;
            break;
          }
          // Find parent
          current = locations.find(l => l.id === current?.parentId);
          depth++;
        }

        if (!found) return false;
      }

      return true;
    });
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    applyFilters,
  };
}