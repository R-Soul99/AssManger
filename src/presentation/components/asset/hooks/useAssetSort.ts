import { useState, useCallback } from 'react';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';

export type SortField = 'tag' | 'description' | 'category' | 'location' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export function useAssetSort() {
  const [sortState, setSortState] = useState<SortState>({
    field: 'tag',
    direction: 'asc',
  });

  const toggleSort = useCallback((field: SortField) => {
    setSortState((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const sortAssets = useCallback((assets: AssetWithRelations[]) => {
    return [...assets].sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      switch (sortState.field) {
        case 'tag':
          valA = a.asset.tag;
          valB = b.asset.tag;
          break;
        case 'description':
          valA = a.asset.description;
          valB = b.asset.description;
          break;
        case 'category':
          valA = a.category?.name || '';
          valB = b.category?.name || '';
          break;
        case 'location':
          valA = a.locationPath || '';
          valB = b.locationPath || '';
          break;
        case 'status':
          valA = a.asset.status;
          valB = b.asset.status;
          break;
      }

      // Handle empty values (push to bottom)
      if (!valA && !valB) return 0;
      if (!valA) return 1;
      if (!valB) return -1;

      const comparison = valA.localeCompare(valB);
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [sortState]);

  return {
    sortState,
    toggleSort,
    sortAssets,
  };
}