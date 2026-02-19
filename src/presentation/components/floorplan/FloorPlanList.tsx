import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { Add as AddIcon, CheckBox as CheckBoxIcon } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { FloorPlan } from '@/domain/entities';
import { Location } from '@/domain/entities';
import { FloorPlanService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { FloorPlanImportDialog } from './FloorPlanImportDialog';
import { FloorPlanDetailView } from './FloorPlanDetailView';
import { FloorPlanViewer } from './FloorPlanViewer';
import { SortableFloorPlanCard, FloorPlanCard } from './FloorPlanCard';
import { FloorPlanBulkActions } from './FloorPlanBulkActions';

interface FloorPlanGroup {
  locationId: string | null;
  locationPath: string;
  plans: FloorPlan[];
}

interface MarkerCounts {
  [floorPlanId: string]: number;
}

export function FloorPlanList() {
  const [groups, setGroups] = useState<FloorPlanGroup[]>([]);
  const [markerCounts, setMarkerCounts] = useState<MarkerCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px drag before starting
      },
    })
  );

  const loadFloorPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const floorPlanService = new FloorPlanService(
        RepositoryFactory.getInstance().getFloorPlanRepository()
      );
      const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
      const floorPlanRepo = RepositoryFactory.getInstance().getFloorPlanRepository();

      const [fpResult, allLocations] = await Promise.all([
        floorPlanService.getAllFloorPlans(),
        locationRepo.findAll(),
      ]);

      if (!fpResult.success) {
        throw new Error(fpResult.error);
      }

      const floorPlans = fpResult.data;
      const locationMap = new Map(allLocations.map((l) => [l.id, l]));

      // Group floor plans by location
      const groupMap = new Map<string | null, FloorPlan[]>();
      for (const plan of floorPlans) {
        const key = plan.locationId;
        const existing = groupMap.get(key) || [];
        existing.push(plan);
        groupMap.set(key, existing);
      }

      // Build groups with location paths, sorted by displayOrder
      const groupedPlans: FloorPlanGroup[] = Array.from(groupMap.entries())
        .map(([locationId, plans]) => ({
          locationId,
          locationPath: locationId ? buildPath(locationId, locationMap) : 'Unassigned',
          plans: plans.sort((a, b) => a.displayOrder - b.displayOrder),
        }))
        .sort((a, b) => {
          // Unassigned at the end
          if (a.locationId === null) return 1;
          if (b.locationId === null) return -1;
          return a.locationPath.localeCompare(b.locationPath);
        });

      setGroups(groupedPlans);

      // Load marker counts for all plans
      const counts: MarkerCounts = {};
      for (const plan of floorPlans) {
        counts[plan.id] = await floorPlanRepo.getMarkerCount(plan.id);
      }
      setMarkerCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load floor plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFloorPlans();
  }, [loadFloorPlans]);

  const handleDragEnd = async (event: DragEndEvent, group: FloorPlanGroup) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !group.locationId) return;

    const planIds = group.plans.map((p) => p.id);
    const oldIndex = planIds.indexOf(active.id as string);
    const newIndex = planIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(planIds, oldIndex, newIndex);

    // Optimistic update
    setGroups((prev) =>
      prev.map((g) => {
        if (g.locationId === group.locationId) {
          const reordered = newOrder
            .map((id) => g.plans.find((p) => p.id === id))
            .filter((p): p is FloorPlan => p !== undefined);
          return { ...g, plans: reordered };
        }
        return g;
      })
    );

    // Persist to database
    try {
      const floorPlanService = new FloorPlanService(
        RepositoryFactory.getInstance().getFloorPlanRepository()
      );
      await floorPlanService.reorderFloorPlans(group.locationId, newOrder);
    } catch (err) {
      // Revert on error
      setError('Failed to save reorder');
      loadFloorPlans();
    }
  };

  const handleSelectionToggle = (planId: string) => {
    setSelectedPlanIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedPlanIds(new Set());
  };

  const handleClearSelection = () => {
    setSelectedPlanIds(new Set());
  };

  const handleDeleteComplete = () => {
    setSelectionMode(false);
    setSelectedPlanIds(new Set());
    loadFloorPlans();
  };

  // Get selected plans for bulk actions
  const selectedPlans = groups.flatMap((g) => g.plans).filter((p) => selectedPlanIds.has(p.id));

  // Show viewer if a plan is being viewed
  if (viewingPlanId) {
    return (
      <FloorPlanViewer
        floorPlanId={viewingPlanId}
        onBack={() => {
          setViewingPlanId(null);
          loadFloorPlans(); // refresh marker counts after any placements/deletions in viewer
        }}
      />
    );
  }

  // Show detail view if a plan is selected
  if (selectedPlanId) {
    return (
      <FloorPlanDetailView
        floorPlanId={selectedPlanId}
        onBack={() => setSelectedPlanId(null)}
        onUpdated={loadFloorPlans}
      />
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Floor Plans</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={selectionMode ? 'contained' : 'outlined'}
            startIcon={<CheckBoxIcon />}
            onClick={handleToggleSelectionMode}
          >
            {selectionMode ? 'Exit Selection' : 'Select'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import Floor Plan
          </Button>
        </Box>
      </Box>

      {selectionMode && (
        <FloorPlanBulkActions
          selectedPlans={selectedPlans}
          markerCounts={markerCounts}
          onClearSelection={handleClearSelection}
          onDeleteComplete={handleDeleteComplete}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {groups.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No floor plans yet. Import your first floor plan to get started.
          </Typography>
        </Paper>
      ) : (
        groups.map((group) => (
          <Box key={group.locationId || 'unassigned'} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              {group.locationPath}
            </Typography>
            {group.locationId ? (
              // Sortable group (has location)
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, group)}
              >
                <SortableContext
                  items={group.plans.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {group.plans.map((plan) => (
                      <SortableFloorPlanCard
                        key={plan.id}
                        plan={plan}
                        locationPath={group.locationPath}
                        markerCount={markerCounts[plan.id] || 0}
                        onClick={() => setSelectedPlanId(plan.id)}
                        onView={(planId) => setViewingPlanId(planId)}
                        selected={selectedPlanIds.has(plan.id)}
                        onSelectionToggle={selectionMode ? handleSelectionToggle : undefined}
                      />
                    ))}
                  </Box>
                </SortableContext>
              </DndContext>
            ) : (
              // Non-sortable group (unassigned)
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {group.plans.map((plan) => (
                  <FloorPlanCard
                    key={plan.id}
                    plan={plan}
                    locationPath=""
                    markerCount={markerCounts[plan.id] || 0}
                    onClick={() => setSelectedPlanId(plan.id)}
                    onView={(planId) => setViewingPlanId(planId)}
                    selected={selectedPlanIds.has(plan.id)}
                    onSelectionToggle={selectionMode ? handleSelectionToggle : undefined}
                  />
                ))}
              </Box>
            )}
          </Box>
        ))
      )}

      <FloorPlanImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImported={loadFloorPlans}
      />
    </Box>
  );
}

function buildPath(locationId: string, locationMap: Map<string, Location>): string {
  const parts: string[] = [];
  let current = locationMap.get(locationId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? locationMap.get(current.parentId) : undefined;
  }
  return parts.join(' > ');
}
