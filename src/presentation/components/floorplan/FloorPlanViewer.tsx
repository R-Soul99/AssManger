import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { FloorPlan } from '@/domain/entities';
import { FloorPlanService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { FloorPlanCanvas } from './FloorPlanCanvas';

interface FloorPlanViewerProps {
  floorPlanId: string;
}

/**
 * Container component for floor plan viewing.
 *
 * Fetches floor plan data, calculates canvas dimensions to fit viewport,
 * and renders the floor plan on canvas with proper aspect ratio.
 *
 * @param floorPlanId - ID of the floor plan to display
 */
export function FloorPlanViewer({ floorPlanId }: FloorPlanViewerProps) {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch floor plan data
  useEffect(() => {
    const loadFloorPlan = async () => {
      setLoading(true);
      setError(null);

      try {
        const floorPlanService = new FloorPlanService(
          RepositoryFactory.getInstance().getFloorPlanRepository()
        );

        const result = await floorPlanService.getFloorPlanById(floorPlanId);

        if (!result.success) {
          setError(result.error || 'Floor plan not found');
          setLoading(false);
          return;
        }

        setFloorPlan(result.data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load floor plan');
        setLoading(false);
      }
    };

    loadFloorPlan();
  }, [floorPlanId]);

  // Calculate canvas dimensions when floor plan loads or window resizes
  useEffect(() => {
    if (!floorPlan || !containerRef.current) {
      return;
    }

    const calculateDimensions = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Apply padding (20px on each side = 40px total)
      const padding = 40;
      const availableWidth = containerWidth - padding;
      const availableHeight = containerHeight - padding;

      // Calculate scaled dimensions maintaining aspect ratio
      const aspectRatio = floorPlan.getAspectRatio();

      let width = availableWidth;
      let height = width / aspectRatio;

      // If height exceeds available space, scale down based on height
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }

      setCanvasDimensions({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    };

    // Calculate initial dimensions
    calculateDimensions();

    // Recalculate on window resize
    const handleResize = () => {
      calculateDimensions();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [floorPlan]);

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error || !floorPlan) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
        }}
      >
        <Alert severity="error">{error || 'Floor plan not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <FloorPlanCanvas
        floorPlan={floorPlan}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
      />
    </Box>
  );
}
