import { v4 as uuidv4 } from 'uuid';
import { useRef, useEffect, forwardRef, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FloorPlan, Marker, Category, Asset } from '@/domain/entities';
import { useFloorPlanImage } from '@/presentation/hooks/useFloorPlanImage';
import { useMarkers } from '@/presentation/hooks/useMarkers';
import { MarkerPopup } from './MarkerPopup';
import { MarkerWithDetails } from '@/application/services/MarkerService';
import { markerService } from '@/application/services/MarkerService';

export interface PlaceholderMarker {
  id: string;           // temporary uuidv4()
  normalizedX: number;
  normalizedY: number;
  isPlaceholder: true;
}

interface FloorPlanCanvasProps {
  floorPlan: FloorPlan;
  width: number;
  height: number;
  onAssetSelected?: (assetId: string) => void;
  visibleCategories: Set<number>;
  selectedStatus: string | 'all';
  isEditMode?: boolean;                          // false = view mode (default)
  placeholders?: PlaceholderMarker[];            // unlinked placeholder markers from parent
  onPlaceholderPlaced?: (p: PlaceholderMarker) => void;  // parent stores the new placeholder
  onPlaceholderSelect?: (p: PlaceholderMarker) => void;  // user clicked a placeholder -> show link dialog
  onMarkerEditSelect?: (m: MarkerWithDetails) => void;   // user clicked linked marker in edit mode -> show edit popup
  onMarkerMoved?: () => void;                    // called after moveMarker() so parent can refresh
  markerVersion?: number;                        // increment to trigger marker re-fetch after mutations
}

/**
 * Helper function to draw a marker on the canvas with filter support.
 *
 * @param ctx - Canvas 2D context
 * @param marker - Marker entity with normalized coordinates
 * @param asset - Asset entity with status info
 * @param category - Category entity with color and styling info
 * @param isSelected - Whether this marker is selected
 * @param canvasWidth - Logical canvas width (for coordinate conversion)
 * @param canvasHeight - Logical canvas height (for coordinate conversion)
 * @param visibleCategories - Set of visible category IDs
 * @param selectedStatus - Currently selected status filter
 */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  marker: Marker,
  asset: Asset,
  category: Category,
  isSelected: boolean,
  canvasWidth: number,
  canvasHeight: number,
  visibleCategories: Set<number>,
  selectedStatus: string | 'all'
) {
  // Convert normalized coords (0-1) to canvas pixels
  const x = marker.normalizedX * canvasWidth;
  const y = marker.normalizedY * canvasHeight;

  const radius = 12; // Marker size in pixels

  // Calculate opacity based on filters
  const categoryVisible = visibleCategories.has(category.id);
  const statusMatches = selectedStatus === 'all' || asset.status === selectedStatus;

  // Per plan: dim non-matching to 30% opacity (not hide)
  const opacity = categoryVisible && statusMatches ? 1.0 : 0.3;

  // Apply opacity
  ctx.globalAlpha = opacity;

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

  // Reset opacity
  ctx.globalAlpha = 1.0;
}

function drawPlaceholderMarker(
  ctx: CanvasRenderingContext2D,
  placeholder: PlaceholderMarker,
  canvasWidth: number,
  canvasHeight: number,
  isSelected: boolean
) {
  const x = placeholder.normalizedX * canvasWidth;
  const y = placeholder.normalizedY * canvasHeight;
  const radius = 12;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = isSelected ? '#1976d2' : '#666666';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = isSelected ? '#1976d2' : '#666666';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', x, y);
  ctx.restore();
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
 * - Markers dim to 30% opacity when filtered out (not hidden completely)
 *
 * @param floorPlan - FloorPlan entity with image dimensions and path
 * @param width - Display width in pixels
 * @param height - Display height in pixels
 * @param visibleCategories - Set of visible category IDs
 * @param selectedStatus - Currently selected status filter
 * @param ref - Forward ref to TransformWrapper for zoom control
 */
export const FloorPlanCanvas = forwardRef<ReactZoomPanPinchRef, FloorPlanCanvasProps>(
  (
    {
      floorPlan,
      width,
      height,
      onAssetSelected,
      visibleCategories,
      selectedStatus,
      isEditMode = false,
      placeholders,
      onPlaceholderPlaced,
      onPlaceholderSelect,
      onMarkerEditSelect,
      onMarkerMoved,
      markerVersion = 0,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { imageData, loading, error } = useFloorPlanImage(floorPlan.imageRelativePath);
    const { markers, loading: markersLoading, error: markersError } = useMarkers(floorPlan.id, markerVersion);
    const [selectedMarker, setSelectedMarker] = useState<MarkerWithDetails | null>(null);
    const [selectedPlaceholder, setSelectedPlaceholder] = useState<PlaceholderMarker | null>(null);

    interface DragState {
      markerId: string;
      isPlaceholder: boolean;
      startCanvasX: number;
      startCanvasY: number;
      currentCanvasX: number;
      currentCanvasY: number;
      activated: boolean;
    }

    const dragStateRef = useRef<DragState | null>(null);
    const DRAG_ACTIVATION_DISTANCE = 6;
    // Track whether TransformWrapper is actively panning (to suppress canvas click-to-place)
    const isPanningRef = useRef(false);

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

      // Draw markers on top of floor plan with filter support
      if (!markersLoading && markers.length > 0) {
        markers.forEach(({ marker, asset, category }) => {
          drawMarker(
            ctx,
            marker,
            asset,
            category,
            selectedMarker?.marker.id === marker.id,
            canvas.width,
            canvas.height,
            visibleCategories,
            selectedStatus
          );
        });
      }

      // Draw placeholder markers in edit mode
      if (isEditMode && placeholders && placeholders.length > 0) {
        placeholders.forEach((p) => {
          drawPlaceholderMarker(ctx, p, canvas.width, canvas.height, selectedPlaceholder?.id === p.id);
        });
      }

      console.log(
        `[FloorPlanCanvas] Rendered floor plan: logical=${canvas.width}x${canvas.height}, display=${width}x${height}, markers=${markers.length}, filters={categories:${visibleCategories.size}, status:${selectedStatus}}`
      );
    }, [
      imageData,
      floorPlan.imageWidth,
      floorPlan.imageHeight,
      width,
      height,
      markers,
      markersLoading,
      selectedMarker,
      visibleCategories,
      selectedStatus,
      placeholders,
      isEditMode,
      selectedPlaceholder,
    ]);

    const screenToCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        canvasX: (e.clientX - rect.left) * scaleX,
        canvasY: (e.clientY - rect.top) * scaleY,
      };
    };

    const findHitAtPosition = (canvasX: number, canvasY: number) => {
      const canvas = canvasRef.current!;
      const MARKER_RADIUS = 12;

      // Check linked markers
      for (const m of markers) {
        const mx = m.marker.normalizedX * canvas.width;
        const my = m.marker.normalizedY * canvas.height;
        if (Math.sqrt((canvasX - mx) ** 2 + (canvasY - my) ** 2) <= MARKER_RADIUS) {
          return { type: 'linked' as const, marker: m };
        }
      }

      // Check placeholder markers
      for (const p of (placeholders || [])) {
        const px = p.normalizedX * canvas.width;
        const py = p.normalizedY * canvas.height;
        if (Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2) <= MARKER_RADIUS) {
          return { type: 'placeholder' as const, placeholder: p };
        }
      }

      return null;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isEditMode) return;
      const { canvasX, canvasY } = screenToCanvas(e);
      const hit = findHitAtPosition(canvasX, canvasY);
      if (hit) {
        dragStateRef.current = {
          markerId: hit.type === 'linked' ? hit.marker.marker.id : hit.placeholder.id,
          isPlaceholder: hit.type === 'placeholder',
          startCanvasX: canvasX,
          startCanvasY: canvasY,
          currentCanvasX: canvasX,
          currentCanvasY: canvasY,
          activated: false,
        };
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isEditMode || !dragStateRef.current) return;
      const { canvasX, canvasY } = screenToCanvas(e);
      dragStateRef.current.currentCanvasX = canvasX;
      dragStateRef.current.currentCanvasY = canvasY;
      if (!dragStateRef.current.activated) {
        const dx = canvasX - dragStateRef.current.startCanvasX;
        const dy = canvasY - dragStateRef.current.startCanvasY;
        if (Math.sqrt(dx * dx + dy * dy) >= DRAG_ACTIVATION_DISTANCE) {
          dragStateRef.current.activated = true;
        }
      }
      // Redraw handled by existing useEffect — drag position visual feedback deferred
    };

    const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isEditMode || !dragStateRef.current) return;
      const { canvasX, canvasY } = screenToCanvas(e);
      const state = dragStateRef.current;
      dragStateRef.current = null;

      if (state.activated && !state.isPlaceholder) {
        // Save repositioned linked marker
        const canvas = canvasRef.current!;
        const normalizedX = Math.max(0, Math.min(1, canvasX / canvas.width));
        const normalizedY = Math.max(0, Math.min(1, canvasY / canvas.height));
        try {
          await markerService.moveMarker(state.markerId, normalizedX, normalizedY);
          onMarkerMoved?.();
        } catch (err) {
          console.error('[FloorPlanCanvas] Failed to move marker:', err);
        }
      }
      // If not activated -> treat as click (handled in handleCanvasClick)
    };

    // Handle canvas click for marker selection
    const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Skip if drag was activated (mouseup already handled)
      if (dragStateRef.current?.activated) return;
      // Skip if TransformWrapper was panning (avoids placing a marker after a pan gesture)
      if (isPanningRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      if (isEditMode) {
        const hit = findHitAtPosition(clickX, clickY);
        if (hit?.type === 'linked') {
          // Edit mode: linked marker click -> show edit popup
          onMarkerEditSelect?.(hit.marker);
          setSelectedMarker(null);
        } else if (hit?.type === 'placeholder') {
          // Edit mode: placeholder click -> show asset link dialog
          setSelectedPlaceholder(hit.placeholder);
          onPlaceholderSelect?.(hit.placeholder);
        } else {
          // Edit mode: empty space click -> place new placeholder
          const normalizedX = Math.max(0, Math.min(1, clickX / canvas.width));
          const normalizedY = Math.max(0, Math.min(1, clickY / canvas.height));
          const newPlaceholder: PlaceholderMarker = {
            id: uuidv4(),
            normalizedX,
            normalizedY,
            isPlaceholder: true,
          };
          onPlaceholderPlaced?.(newPlaceholder);
          setSelectedPlaceholder(newPlaceholder);
          onPlaceholderSelect?.(newPlaceholder);
        }
      } else {
        // View mode: existing hit detection for marker popup
        const clicked = markers.find(({ marker }) => {
          const mx = marker.normalizedX * canvas.width;
          const my = marker.normalizedY * canvas.height;
          const dist = Math.sqrt((clickX - mx) ** 2 + (clickY - my) ** 2);
          return dist <= 12;
        });
        setSelectedMarker(clicked || null);

        if (clicked) {
          console.log(
            `[FloorPlanCanvas] Marker selected: ${clicked.marker.id}, asset: ${clicked.asset.tag}`
          );
        }
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
          onPanningStart={() => { isPanningRef.current = true; }}
          onPanningStop={() => {
            // Delay clearing the flag so the click event that fires after pan-stop is suppressed
            setTimeout(() => { isPanningRef.current = false; }, 50);
          }}
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
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                display: 'block',
                cursor: isEditMode ? 'crosshair' : 'pointer',
              }}
            />
          </TransformComponent>
        </TransformWrapper>

        {/* Marker popup - only in view mode */}
        {!isEditMode && selectedMarker && (
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
