import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FloorPlan, Category } from '@/domain/entities';
import { FloorPlanService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { FloorPlanCanvas, PlaceholderMarker } from './FloorPlanCanvas';
import { FloorPlanViewerToolbar } from './FloorPlanViewerToolbar';
import { FloorPlanFilterSidebar } from './FloorPlanFilterSidebar';
import { useMarkers } from '@/presentation/hooks/useMarkers';
import AssetDetailDrawer from '@/presentation/components/asset/AssetDetailDrawer';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';

interface FloorPlanViewerProps {
  floorPlanId: string;
  onBack?: () => void;
}

/**
 * Container component for floor plan viewing with filtering controls.
 *
 * Fetches floor plan data, calculates canvas dimensions to fit viewport,
 * and renders the floor plan on canvas with proper aspect ratio.
 *
 * Features:
 * - Toolbar with category visibility toggles
 * - Sidebar with status filters
 * - Filtered markers dimmed to 30% opacity
 * - Pan/zoom controls
 * - Asset detail drawer
 *
 * @param floorPlanId - ID of the floor plan to display
 */
export function FloorPlanViewer({ floorPlanId, onBack }: FloorPlanViewerProps) {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithRelations | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Filter state
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Set<number>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Placeholder marker state (persists in viewer to survive re-renders)
  const [placeholders, setPlaceholders] = useState<PlaceholderMarker[]>([]);
  // _selectedPlaceholder read by Plan 04 AssetLinkDialog — declared here so state lives in viewer
  const [_selectedPlaceholder, setSelectedPlaceholder] = useState<PlaceholderMarker | null>(null);

  // Marker version trigger for post-mutation re-fetch
  const [markerVersion, setMarkerVersion] = useState(0);
  const refreshMarkers = () => setMarkerVersion(v => v + 1);

  // Fetch markers for marker counts
  const { markers } = useMarkers(floorPlanId, markerVersion);

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

  // Load all categories on mount and initialize visibleCategories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryRepo = RepositoryFactory.getInstance().getCategoryRepository();
        const cats = await categoryRepo.findAll();
        setAllCategories(cats);
        // Initialize with all categories visible
        setVisibleCategories(new Set(cats.map((c) => c.id)));
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };

    loadCategories();
  }, []);

  // Calculate marker counts per status
  const markerCounts = useMemo(() => {
    const counts: { [status: string]: number } = {};
    markers.forEach(({ asset }) => {
      counts[asset.status] = (counts[asset.status] || 0) + 1;
    });
    return counts;
  }, [markers]);

  // Calculate filtered marker count (respects category visibility and status filter)
  const filteredMarkerCount = useMemo(() => {
    return markers.filter(({ asset, category }) => {
      const categoryVisible = visibleCategories.has(category.id);
      const statusMatches = selectedStatus === 'all' || asset.status === selectedStatus;
      return categoryVisible && statusMatches;
    }).length;
  }, [markers, visibleCategories, selectedStatus]);

  // Toggle category visibility
  const handleToggleCategory = (categoryId: number) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

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

  // Fetch asset with relations when asset ID selected
  useEffect(() => {
    if (!selectedAssetId) {
      setSelectedAsset(null);
      return;
    }

    const loadAssetData = async () => {
      try {
        const factory = RepositoryFactory.getInstance();
        const assetRepo = factory.getAssetRepository();
        const categoryRepo = factory.getCategoryRepository();
        const locationRepo = factory.getLocationRepository();

        // Fetch asset with relations
        const assets = await assetRepo.findAllWithRelations();
        const asset = assets.find((a) => a.asset.id === selectedAssetId);

        if (asset) {
          setSelectedAsset(asset);
        }

        // Fetch categories and locations for the drawer
        const cats = await categoryRepo.findAll();
        const locs = await locationRepo.findAll();
        setCategories(cats);
        setLocations(locs);
      } catch (err) {
        console.error('Failed to load asset data:', err);
      }
    };

    loadAssetData();
  }, [selectedAssetId]);

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
        onAssetSelected={(assetId) => setSelectedAssetId(assetId)}
        visibleCategories={visibleCategories}
        selectedStatus={selectedStatus}
        isEditMode={isEditMode}
        placeholders={placeholders}
        onPlaceholderPlaced={(p) => setPlaceholders(prev => [...prev, p])}
        onPlaceholderSelect={(p) => setSelectedPlaceholder(p)}
        onMarkerEditSelect={(m) => {
          // Plan 05 will handle this — for now, log it
          console.log('[FloorPlanViewer] Marker selected for edit:', m.marker.id);
        }}
        onMarkerMoved={() => {
          refreshMarkers();
        }}
      />

      {/* Filter toolbar */}
      <FloorPlanViewerToolbar
        categories={allCategories}
        visibleCategories={visibleCategories}
        onToggleCategory={handleToggleCategory}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isEditMode={isEditMode}
        onToggleEditMode={() => setIsEditMode((prev) => !prev)}
        filteredMarkerCount={filteredMarkerCount}
      />

      {/* Filter sidebar */}
      <FloorPlanFilterSidebar
        open={sidebarOpen}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onClose={() => setSidebarOpen(false)}
        markerCounts={markerCounts}
      />

      {/* Back button */}
      {onBack && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
          }}
        >
          <Tooltip title="Back to Floor Plans" placement="right">
            <IconButton
              onClick={onBack}
              aria-label="Back"
              sx={{
                backgroundColor: 'white',
                boxShadow: 2,
                '&:hover': { backgroundColor: 'grey.100' },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

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

      {/* Asset detail drawer */}
      {selectedAsset && (
        <AssetDetailDrawer
          asset={selectedAsset}
          onClose={() => {
            setSelectedAssetId(null);
            setSelectedAsset(null);
          }}
          onSave={() => {
            // Refresh not needed for floor plan viewer
          }}
          categories={categories}
          locations={locations}
        />
      )}
    </Box>
  );
}
