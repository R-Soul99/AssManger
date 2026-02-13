import { useRef, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { FloorPlan } from '@/domain/entities';
import { useFloorPlanImage } from '@/presentation/hooks/useFloorPlanImage';

interface FloorPlanCanvasProps {
  floorPlan: FloorPlan;
  width: number;
  height: number;
}

/**
 * Canvas component for rendering floor plan images.
 *
 * Implements coordinate system where:
 * - Canvas logical size = floor plan image dimensions (for 1:1 pixel mapping)
 * - Canvas display size = width/height props (for viewport fitting)
 * - Markers use normalized 0-1 coordinates
 *
 * @param floorPlan - FloorPlan entity with image dimensions and path
 * @param width - Display width in pixels
 * @param height - Display height in pixels
 */
export function FloorPlanCanvas({ floorPlan, width, height }: FloorPlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { imageData, loading, error } = useFloorPlanImage(floorPlan.imageRelativePath);

  // Draw floor plan image on canvas when loaded
  useEffect(() => {
    if (!canvasRef.current || !imageData) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get 2D context from canvas');
      return;
    }

    // Set logical size to match floor plan image dimensions
    // This allows 1:1 pixel mapping for marker coordinates
    canvas.width = floorPlan.imageWidth;
    canvas.height = floorPlan.imageHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor plan image at full logical size
    ctx.drawImage(imageData, 0, 0, canvas.width, canvas.height);

    console.log(
      `[FloorPlanCanvas] Rendered floor plan: logical=${canvas.width}x${canvas.height}, display=${width}x${height}`
    );
  }, [imageData, floorPlan.imageWidth, floorPlan.imageHeight, width, height]);

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width,
          height,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ width, height, p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Calculate aspect ratio to verify display dimensions
  const aspectRatio = floorPlan.getAspectRatio();
  const displayAspectRatio = width / height;

  // Log aspect ratio mismatch (informational)
  if (Math.abs(aspectRatio - displayAspectRatio) > 0.01) {
    console.warn(
      `[FloorPlanCanvas] Aspect ratio mismatch: image=${aspectRatio.toFixed(2)}, display=${displayAspectRatio.toFixed(2)}`
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
      }}
    />
  );
}
