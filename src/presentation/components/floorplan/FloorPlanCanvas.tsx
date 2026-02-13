import { useRef, useEffect, forwardRef, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FloorPlan, Marker, Category } from '@/domain/entities';
import { useFloorPlanImage } from '@/presentation/hooks/useFloorPlanImage';
import { useMarkers } from '@/presentation/hooks/useMarkers';
import { MarkerPopup } from './MarkerPopup';
import { MarkerWithDetails } from '@/application/services/MarkerService';

interface FloorPlanCanvasProps {
  floorPlan: FloorPlan;
  width: number;
  height: number;
  onAssetSelected?: (assetId: string) => void;
}

/**
 * Helper function to draw a marker on the canvas.
 *
 * @param ctx - Canvas 2D context
 * @param marker - Marker entity with normalized coordinates
 * @param category - Category entity with color and styling info
 * @param isSelected - Whether this marker is selected
 * @param canvasWidth - Logical canvas width (for coordinate conversion)
 * @param canvasHeight - Logical canvas height (for coordinate conversion)
 */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  marker: Marker,
  category: Category,
  isSelected: boolean,
  canvasWidth: number,
  canvasHeight: number
) {
  // Convert normalized coords (0-1) to canvas pixels
  const x = marker.normalizedX * canvasWidth;
  const y = marker.normalizedY * canvasHeight;

  const radius = 12; // Marker size in pixels

  // Draw marker circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = category.color;
  ctx.fill();

  // Draw selection ring if selected
  if (isSelected) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Draw category icon (simplified - use first letter of category name)
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(category.name[0].toUpperCase(), x, y);
}

/**
 * Canvas component for rendering floor plan images with pan/zoom controls and markers.
 *
 * Implements coordinate system where:
 * - Canvas logical size = floor plan image dimensions (for 1:1 pixel mapping)
 * - Canvas display size = width/height props (for viewport fitting)
 * - Markers use normalized 0-1 coordinates
 *
 * Pan/zoom powered by react-zoom-pan-pinch:
 * - Drag to pan (direct feel, no momentum)
 * - Mouse wheel to zoom (smooth increments)
 * - Zoom range: 50%-500%
 * - Exposes ref for programmatic control (zoom in/out/reset)
 *
 * Marker rendering:
 * - Markers displayed as colored circles with category initial
 * - Click to select marker (shows selection ring)
 * - Markers scale with floor plan during pan/zoom
 *
 * @param floorPlan - FloorPlan entity with image dimensions and path
 * @param width - Display width in pixels
 * @param height - Display height in pixels
 * @param ref - Forward ref to TransformWrapper for zoom control
 */
export const FloorPlanCanvas = forwardRef<ReactZoomPanPinchRef, FloorPlanCanvasProps>(
  ({ floorPlan, width, height, onAssetSelected }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { imageData, loading, error } = useFloorPlanImage(floorPlan.imageRelativePath);
    const { markers, loading: markersLoading, error: markersError } = useMarkers(floorPlan.id);
    const [selectedMarker, setSelectedMarker] = useState<MarkerWithDetails | null>(null);

    // Draw floor plan image and markers on canvas
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

      // Draw markers on top of floor plan
      if (!markersLoading && markers.length > 0) {
        markers.forEach(({ marker, category }) => {
          drawMarker(ctx, marker, category, selectedMarker?.marker.id === marker.id, canvas.width, canvas.height);
        });
      }

      console.log(
        `[FloorPlanCanvas] Rendered floor plan: logical=${canvas.width}x${canvas.height}, display=${width}x${height}, markers=${markers.length}`
      );
    }, [imageData, floorPlan.imageWidth, floorPlan.imageHeight, width, height, markers, markersLoading, selectedMarker]);

    // Handle canvas click for marker selection
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get canvas bounding rect
      const rect = canvas.getBoundingClientRect();

      // Calculate scale factors (canvas logical size vs display size)
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Convert click coordinates from screen space to canvas logical space
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Find clicked marker (hit detection)
      const clicked = markers.find(({ marker }) => {
        const mx = marker.normalizedX * canvas.width;
        const my = marker.normalizedY * canvas.height;
        const dist = Math.sqrt((clickX - mx) ** 2 + (clickY - my) ** 2);
        return dist <= 12; // marker radius
      });

      setSelectedMarker(clicked || null);

      if (clicked) {
        console.log(
          `[FloorPlanCanvas] Marker selected: ${clicked.marker.id}, asset: ${clicked.asset.tag}`
        );
      }
    };

    // Calculate marker screen position for popup anchor
    const getMarkerScreenPosition = (markerDetails: MarkerWithDetails) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = markerDetails.marker.normalizedX * canvas.width;
      const y = markerDetails.marker.normalizedY * canvas.height;

      // Convert canvas logical coords to screen coords
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;

      return {
        x: rect.left + x * scaleX,
        y: rect.top + y * scaleY,
      };
    };

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

    // Show marker loading error (non-blocking)
    if (markersError) {
      console.warn('[FloorPlanCanvas] Failed to load markers:', markersError);
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
      <>
        <TransformWrapper
          ref={ref}
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          wheel={{ step: 0.1 }}
          panning={{ disabled: false }}
          doubleClick={{ disabled: true }}
          velocityAnimation={{ disabled: true }}
        >
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: '100%',
            }}
            contentStyle={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                display: 'block',
                cursor: 'pointer',
              }}
            />
          </TransformComponent>
        </TransformWrapper>

        {/* Marker popup */}
        {selectedMarker && (
          <MarkerPopup
            asset={selectedMarker.asset}
            category={selectedMarker.category}
            anchorPosition={getMarkerScreenPosition(selectedMarker)}
            onClose={() => setSelectedMarker(null)}
            onViewDetails={(assetId) => {
              onAssetSelected?.(assetId);
              setSelectedMarker(null);
            }}
          />
        )}
      </>
    );
  }
);

FloorPlanCanvas.displayName = 'FloorPlanCanvas';
