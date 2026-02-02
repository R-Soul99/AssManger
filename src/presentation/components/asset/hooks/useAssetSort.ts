import { useState, useCallback } from 'react';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';

export type SortField = 'tag' | 'description' | 'category' | 'location' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export interface UseAssetSortResult {
  sortState: SortState;
  toggleSort: (field: SortField) => void;
  sortAssets: (assets: AssetWithRelations[]) => AssetWithRelations[];
}

/**
 * Hook for managing asset sort state and applying sorting to asset lists.
 * Supports sorting by tag, description, category, location, and status.
 */
export function useAssetSort(defaultField: SortField = 'tag'): UseAssetSortResult {
  const [sortState, setSortState] = useState<SortState>({
    field: defaultField,
    direction: 'asc',
  });

  const toggleSort = useCallback((field: SortField) => {
    setSortState((prev) => {
      // If clicking the same field, toggle direction
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      // If clicking a different field, sort ascending by default
      return {
        field,
        direction: 'asc',
      };
    });
  }, []);

  const sortAssets = useCallback(
    (assets: AssetWithRelations[]): AssetWithRelations[] => {
      const sorted = [...assets];

      sorted.sort((a, b) => {
        let compareA: string | null = '';
        let compareB: string | null = '';

        switch (sortState.field) {
          case 'tag':
            compareA = a.asset.tag.toLowerCase();
            compareB = b.asset.tag.toLowerCase();
            break;
          case 'description':
            compareA = a.asset.description.toLowerCase();
            compareB = b.asset.description.toLowerCase();
            break;
          case 'category':
            compareA = a.category?.name.toLowerCase() || null;
            compareB = b.category?.name.toLowerCase() || null;
            break;
          case 'location':
            compareA = a.locationPath?.toLowerCase() || null;
            compareB = b.locationPath?.toLowerCase() || null;
            break;
          case 'status':
            compareA = a.asset.status.toLowerCase();
            compareB = b.asset.status.toLowerCase();
            break;
        }

        // Handle null values - sort them to the end
        if (compareA === null && compareB === null) return 0;
        if (compareA === null) return 1;
        if (compareB === null) return -1;

        // Use localeCompare for proper string sorting
        const comparison = compareA.localeCompare(compareB);

        // Apply sort direction
        return sortState.direction === 'asc' ? comparison : -comparison;
      });

      return sorted;
    },
    [sortState]
  );

  return {
    sortState,
    toggleSort,
    sortAssets,
  };
}
