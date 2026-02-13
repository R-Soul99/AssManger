import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
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
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

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

  // Keyboard shortcuts for pan/zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!transformRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          transformRef.current.setTransform(
            transformRef.current.state.positionX,
            transformRef.current.state.positionY + 50,
            transformRef.current.state.scale
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          transformRef.current.setTransform(
            transformRef.current.state.positionX,
            transformRef.current.state.positionY - 50,
            transformRef.current.state.scale
          );
          break;
        case 'ArrowLeft':
          e.preventDefault();
          transformRef.current.setTransform(
            transformRef.current.state.positionX + 50,
            transformRef.current.state.positionY,
            transformRef.current.state.scale
          );
          break;
        case 'ArrowRight':
          e.preventDefault();
          transformRef.current.setTransform(
            transformRef.current.state.positionX - 50,
            transformRef.current.state.positionY,
            transformRef.current.state.scale
          );
          break;
        case '+':
        case '=':
          e.preventDefault();
          transformRef.current.zoomIn(0.2);
          break;
        case '-':
        case '_':
          e.preventDefault();
          transformRef.current.zoomOut(0.2);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        ref={transformRef}
        floorPlan={floorPlan}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
      />

      {/* Zoom control toolbar */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          backgroundColor: 'white',
          borderRadius: 1,
          boxShadow: 2,
          p: 0.5,
        }}
      >
        <Tooltip title="Zoom In (+)" placement="left">
          <IconButton
            size="small"
            onClick={() => transformRef.current?.zoomIn(0.2)}
            aria-label="Zoom in"
          >
            <ZoomInIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Zoom Out (-)" placement="left">
          <IconButton
            size="small"
            onClick={() => transformRef.current?.zoomOut(0.2)}
            aria-label="Zoom out"
          >
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Reset Zoom" placement="left">
          <IconButton
            size="small"
            onClick={() => transformRef.current?.resetTransform()}
            aria-label="Reset zoom"
          >
            <CenterFocusStrongIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
