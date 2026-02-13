import { useState, useEffect } from 'react';
import { markerService, MarkerWithDetails } from '@/application/services/MarkerService';

interface UseMarkersResult {
  markers: MarkerWithDetails[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for loading markers with enriched asset and category data.
 *
 * Fetches all markers for a floor plan along with their associated
 * asset and category information, enabling category-specific styling.
 *
 * @param floorPlanId - Floor plan ID to fetch markers for (null to skip loading)
 * @returns Object containing markers array, loading state, and error state
 */
export function useMarkers(floorPlanId: string | null): UseMarkersResult {
  const [markers, setMarkers] = useState<MarkerWithDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip loading if no floor plan ID provided
    if (!floorPlanId) {
      setMarkers([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Start loading
    setLoading(true);
    setError(null);

    // Fetch markers with details
    markerService
      .getMarkersWithDetails(floorPlanId)
      .then((data) => {
        setMarkers(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load markers');
        setMarkers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [floorPlanId]);

  return { markers, loading, error };
}
