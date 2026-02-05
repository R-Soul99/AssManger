---
phase: 04-floor-plan-management
plan: 03
type: summary
completed: 2026-02-05
duration: 5min
requires:
  - 04-01-schema-service-mock
  - 04-02-import-workflow
provides:
  - floor-plan-list-view
  - location-grouped-cards
  - drag-to-reorder-ui
  - floor-plan-detail-edit
affects:
  - 04-04-viewer-canvas
  - 05-performance-optimization
subsystem: floor-plan-management
tags:
  - ui
  - dnd-kit
  - mui
  - react-hook-form
  - floor-plans
tech-stack:
  added:
    - "@dnd-kit/core": "drag-and-drop framework"
    - "@dnd-kit/sortable": "sortable list utilities"
    - "@dnd-kit/utilities": "transform utilities for dnd-kit"
  patterns:
    - "location-grouped cards with separate DndContext per group"
    - "useFloorPlanImage hook for loading images from relative paths"
    - "optimistic UI updates with database persistence"
    - "object URL cleanup in useEffect to prevent memory leaks"
key-files:
  created:
    - src/presentation/components/floorplan/hooks/useFloorPlanImage.ts
    - src/presentation/components/floorplan/FloorPlanCard.tsx
    - src/presentation/components/floorplan/FloorPlanDetailView.tsx
    - src/presentation/components/floorplan/FloorPlanList.tsx
  modified:
    - src/presentation/components/floorplan/index.ts
    - src/App.tsx
decisions:
  - id: FP-03-01
    what: "Separate DndContext per location group"
    why: "Drag-to-reorder should only work within same location (prevents moving floor plans between locations via drag)"
    alternatives: "Single DndContext with validation on drop"
    impact: "Cleaner UX - users can't accidentally move floor plans between locations"

  - id: FP-03-02
    what: "Full-page detail view instead of drawer"
    why: "Floor plan preview needs more space than drawer provides, matches importance of viewing/editing floor plans"
    alternatives: "MUI Drawer (like AssetDetailDrawer)"
    impact: "Better UX for viewing large floor plan images, clearer navigation flow"

  - id: FP-03-03
    what: "Unassigned floor plans in separate non-sortable group"
    why: "Floor plans without location have no display_order context (no location to order within)"
    alternatives: "Allow sorting unassigned, use global display_order"
    impact: "Clearer UX - drag only works where it makes semantic sense"

  - id: FP-03-04
    what: "Location dropdown filters to floor and building types only"
    why: "Floor plans represent physical layouts - they attach to floors or buildings, not sites or rooms"
    alternatives: "Allow all location types, allow room-level floor plans"
    impact: "Guides users toward correct hierarchical model"

  - id: FP-03-05
    what: "8px activation distance for drag sensor"
    why: "Prevents accidental drag when user intends to click card to view details"
    alternatives: "Default 0px (any movement starts drag), explicit drag handle"
    impact: "Better UX - click to view is primary action, drag is secondary"
---

# Phase 4 Plan 03: Floor Plan Card List Summary

**One-liner:** Interactive floor plan list with location grouping, drag-to-reorder within groups, and full-page detail/edit view.

## What Was Built

### Main Components

1. **useFloorPlanImage Hook** (`hooks/useFloorPlanImage.ts`)
   - Loads floor plan images from relative database paths
   - Converts to object URLs for browser rendering
   - Handles loading states and errors
   - Proper cleanup (URL.revokeObjectURL) to prevent memory leaks

2. **FloorPlanCard Component** (`FloorPlanCard.tsx`)
   - Three variants: FloorPlanCardContent (base), SortableFloorPlanCard (draggable), FloorPlanCard (non-sortable)
   - Displays 160px thumbnail with loading skeleton
   - Shows location path, floor plan name, marker count chip
   - SVG fallback for failed image loads
   - Hover effect (boxShadow 4), click to open detail view

3. **FloorPlanDetailView Component** (`FloorPlanDetailView.tsx`)
   - Full-page edit view (not drawer)
   - Large image preview (600px max width, 300px height, object-fit contain)
   - Displays image dimensions (width x height pixels)
   - Form for editing name (required) and location (optional)
   - Location dropdown shows hierarchical paths (Site > Building > Floor)
   - Filtered to floor and building types only
   - Dirty state tracking, validation, save/cancel
   - Back navigation to list

4. **FloorPlanList Component** (`FloorPlanList.tsx`)
   - Groups floor plans by locationId with hierarchical path headers
   - Sorts groups alphabetically (unassigned at end)
   - Within each group, plans sorted by displayOrder
   - Separate DndContext per location group (drag within group only)
   - Unassigned group is non-sortable (no locationId = no ordering context)
   - PointerSensor with 8px activation distance (prevents accidental drag)
   - Optimistic UI update on drag, persists via FloorPlanService.reorderFloorPlans
   - Loads marker counts from repository for each plan
   - Import button opens FloorPlanImportDialog
   - Empty state message for no floor plans
   - Card click navigates to FloorPlanDetailView

5. **App.tsx Integration**
   - "Manage Floor Plans" toggle button added after "Manage Locations"
   - showFloorPlans state controls visibility
   - Renders FloorPlanList when toggled

## Technical Implementation

### Drag-to-Reorder Architecture

**dnd-kit Integration:**
- PointerSensor with 8px threshold prevents accidental drags
- closestCenter collision detection
- verticalListSortingStrategy (even though cards display horizontally via flexWrap)
- CSS.Transform.toString() for smooth drag transitions

**Multi-Context Pattern:**
```typescript
// Each location group has its own DndContext
{groups.map(group => (
  group.locationId ? (
    <DndContext onDragEnd={event => handleDragEnd(event, group)}>
      <SortableContext items={group.plans.map(p => p.id)}>
        {/* Sortable cards */}
      </SortableContext>
    </DndContext>
  ) : (
    {/* Non-sortable cards for unassigned */}
  )
))}
```

**Optimistic Update + Persistence:**
1. On drag end: Immediately update local state with new order (arrayMove)
2. Persist to database via FloorPlanService.reorderFloorPlans
3. On error: Show error alert, reload from database to revert UI

### Image Loading Hook Pattern

**useFloorPlanImage:**
- Uses localFileStorage.getAbsolutePath to resolve relative paths
- Reads file via @tauri-apps/plugin-fs readFile
- Creates Blob with image/png MIME type
- Generates object URL for <img src>
- Double cleanup: effect return + unmount effect (prevents memory leaks)
- Handles cancellation flag to prevent state updates after unmount

### Location Grouping Logic

**Group Building:**
1. Load all floor plans and all locations
2. Group floor plans by locationId (Map<string | null, FloorPlan[]>)
3. For each group, build location path by traversing location hierarchy
4. Sort plans within group by displayOrder
5. Sort groups alphabetically, unassigned last

**Path Building:**
```typescript
function buildPath(locationId, locationMap) {
  const parts = [];
  let current = locationMap.get(locationId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? locationMap.get(current.parentId) : undefined;
  }
  return parts.join(' > '); // "Main Campus > Building A > Floor 1"
}
```

## Testing Notes

All functionality tested with MockFloorPlanRepository (Wave 1):
- Floor plan CRUD operations
- Display order persistence
- Marker count queries
- Location assignment/reassignment

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues / Technical Debt

1. **Pre-existing TypeScript errors:** Multiple unrelated type errors in App.debug.tsx, CsvExportService.ts, ProjectService.ts, SqliteAssetRepository.ts, AssetList.tsx (not introduced by this plan)

2. **Image MIME type hardcoded:** useFloorPlanImage uses 'image/png' for all images (plan 04-02 converts all to PNG, so this is correct, but could be more explicit)

3. **Error handling on reorder failure:** Shows generic "Failed to save reorder" alert, doesn't revert optimistic UI granularly (full reload via loadFloorPlans)

## Next Phase Readiness

**Phase 4 Wave 4 (04-04: Viewer Canvas) Prerequisites:**
- ✅ Floor plan entity with imageRelativePath, imageWidth, imageHeight
- ✅ Floor plan service with CRUD operations
- ✅ Floor plan list UI with card selection
- ✅ Image loading hook (useFloorPlanImage) ready for viewer canvas
- ✅ Location assignment in place for filtering floor plans

**Blockers for 04-04:** None

**Concerns:**
- Viewer canvas will need to coordinate with floor plan selection (how to open viewer from card click vs detail view?)
- Calibration UI will need to access the same image loading mechanism (useFloorPlanImage reusable)

## Performance Metrics

- **Duration:** 5 minutes
- **Tasks:** 6/6 completed
- **Commits:** 5 (dnd-kit install was no-op, packages already present)
- **Files Created:** 4 components + 1 hook
- **Files Modified:** 2 (index.ts barrel, App.tsx)
- **Lines Added:** ~720 (hook: 73, card: 113, detail: 262, list: 273, exports: 3, app: 6)

## Lessons Learned

1. **dnd-kit activation constraint essential:** 8px distance prevents frustrating UX where clicks trigger drags
2. **Separate DndContext per group cleaner than global context:** Semantic constraints enforced at UI level (can't drag between locations)
3. **Object URL cleanup critical:** Two useEffects needed (effect return + unmount cleanup) to prevent blob URL memory leaks
4. **Full-page detail view better than drawer for images:** Large preview requires more space than drawer provides
5. **Optimistic updates improve perceived performance:** Instant feedback on drag, async persistence in background

## Wave 3 Complete

Floor Plan Management Phase 4 UI complete:
- ✅ Wave 1 (04-01): Schema, service, mock repository
- ✅ Wave 2 (04-02): Import workflow with image processing
- ✅ Wave 3 (04-03): Card list with grouping, reorder, detail/edit

**Next:** Wave 4 (04-04) - Viewer canvas with pan/zoom and marker placement
