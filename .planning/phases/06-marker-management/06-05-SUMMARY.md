---
phase: 06-marker-management
plan: 05
subsystem: ui
tags: [react, mui, react-laag, markers, edit-mode, delete, relink, integration]

# Dependency graph
requires:
  - phase: 06-marker-management
    plan: 03
    provides: PlaceholderMarker interface, onMarkerEditSelect callback, placeholders state in FloorPlanViewer
  - phase: 06-marker-management
    plan: 04
    provides: AssetLinkDialog and QuickCreateAssetForm components

provides:
  - MarkerEditPopup component (delete with inline confirmation, Change Asset relink action)
  - FloorPlanViewer full integration (AssetLinkDialog for placement + relink, MarkerEditPopup for linked marker edit/delete)
  - FloorPlanList marker count badge refresh on back navigation

affects:
  - Phase 7 calibration (FloorPlanViewer is now complete; calibration will add measurement overlay)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MarkerEditPopup: same react-laag useLayer pattern as MarkerPopup.tsx (trigger.getBounds, auto placement, possiblePlacements)
    - Inline delete confirmation: local confirmDelete boolean state gates Delete button -> Confirm/Cancel inline
    - Dual-mode AssetLinkDialog: open when selectedPlaceholder !== null OR relinkingMarker !== null; onLink handles both paths
    - refreshMarkers() called after every write operation (placeMarker, deleteMarker, relinkMarker, onMarkerMoved)

key-files:
  created:
    - src/presentation/components/floorplan/MarkerEditPopup.tsx
  modified:
    - src/presentation/components/floorplan/FloorPlanViewer.tsx
    - src/presentation/components/floorplan/FloorPlanList.tsx
    - src/presentation/components/floorplan/index.ts

key-decisions:
  - "MarkerEditPopup uses same useLayer pattern as MarkerPopup for consistency and proven edge-aware positioning"
  - "AssetLinkDialog open condition: selectedPlaceholder !== null || relinkingMarker !== null (dual-mode single dialog)"
  - "onLink handler branches on relinkingMarker first, then selectedPlaceholder, for clean dual-mode handling"
  - "onMarkerEditSelect in FloorPlanCanvas fires setEditingMarker + BoundingClientRect screen pos calculation"
  - "loadFloorPlans() called alongside setViewingPlanId(null) in onBack — useCallback already in scope, zero new deps"

requirements-completed: [MRK-01, MRK-02, MRK-03, MRK-04, MRK-05, MRK-06, MRK-07, MRK-08, MRK-09]

# Metrics
duration: 7min
completed: 2026-02-19
---

# Phase 6 Plan 05: MarkerEditPopup and Full FloorPlanViewer Integration Summary

**MarkerEditPopup with inline delete confirmation + Change Asset relink; FloorPlanViewer wired for end-to-end placement/delete/relink flows; FloorPlanCard marker count badge refreshes on back navigation**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-02-19T08:10:47Z
- **Completed:** 2026-02-19T08:17:44Z
- **Tasks:** 2 (Task 3 is human verification checkpoint — not executed by agent)
- **Files modified:** 4

## Accomplishments

- Created `MarkerEditPopup.tsx`: react-laag popup for linked markers in edit mode
  - `confirmDelete` state gates the Delete button — shows "Remove this marker?" inline before `onDelete()` is called
  - `deleting` state disables buttons and shows CircularProgress spinner during async delete
  - `onRelink()` closes popup and opens AssetLinkDialog in relink mode
  - Copy of MarkerPopup.tsx useLayer positioning (trigger.getBounds, auto, possiblePlacements)
- Updated `FloorPlanViewer.tsx` — full end-to-end integration:
  - Imported `AssetLinkDialog`, `MarkerEditPopup`, `markerService`, `MarkerWithDetails`
  - `selectedPlaceholder` state (was `_selectedPlaceholder`) now actively consumed — underscore prefix dropped
  - Added `editingMarker`, `relinkingMarker`, `editMarkerScreenPos` state for popup management
  - `onMarkerEditSelect` now sets editingMarker + calculates screen pos via `canvas.getBoundingClientRect()`
  - `AssetLinkDialog` open condition: `selectedPlaceholder !== null || relinkingMarker !== null`
  - `onLink` handler: branches on `relinkingMarker` (relinkMarker) vs `selectedPlaceholder` (placeMarker); always calls `refreshMarkers()`
  - `MarkerEditPopup` rendered when `editingMarker && editMarkerScreenPos`
  - `onDelete`: calls `markerService.deleteMarker()` then `refreshMarkers()`
  - `onRelink`: moves `editingMarker` into `relinkingMarker` state to open AssetLinkDialog
- Updated `FloorPlanList.tsx` — marker count badge refresh:
  - `onBack` handler now calls `loadFloorPlans()` after `setViewingPlanId(null)`
  - FloorPlanCard badges show updated totals immediately after returning from viewer
- Updated `index.ts` — added `MarkerEditPopup` export

## Task Commits

Each task was committed atomically:

1. **Task 1: MarkerEditPopup + FloorPlanViewer full integration** - `46e249e` (feat)
2. **Task 2: FloorPlanList marker count refresh on back** - `84c3949` (feat)

## Files Created/Modified

- `src/presentation/components/floorplan/MarkerEditPopup.tsx` - New component: react-laag popup for edit mode marker interactions with delete confirmation and relink action
- `src/presentation/components/floorplan/FloorPlanViewer.tsx` - Full integration: AssetLinkDialog (placement + relink), MarkerEditPopup (delete + relink), markerService calls, refreshMarkers after every write
- `src/presentation/components/floorplan/FloorPlanList.tsx` - onBack handler calls loadFloorPlans() to refresh marker counts after viewer session
- `src/presentation/components/floorplan/index.ts` - Added MarkerEditPopup export

## Decisions Made

- MarkerEditPopup reuses the identical useLayer pattern from MarkerPopup.tsx for consistency and proven edge-detection behavior
- AssetLinkDialog is shared between placement and relink flows — single dialog, dual-mode via state branching in onLink
- The `_selectedPlaceholder` underscore prefix introduced in Plan 03 is removed — the state is now actively consumed and the prefix is no longer needed
- Screen position calculation for MarkerEditPopup uses `document.querySelector('canvas').getBoundingClientRect()` — matches the pattern already used by FloorPlanCanvas for MarkerPopup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed underscore prefix from _selectedPlaceholder**
- **Found during:** Task 1 (FloorPlanViewer wiring)
- **Issue:** Plan 03 used `_selectedPlaceholder` prefix to satisfy `noUnusedLocals` while deferring consumption. Plan 05 now consumes this state — keeping the underscore would be misleading and inconsistent with the rest of the codebase
- **Fix:** Renamed to `selectedPlaceholder` (active use; underscore prefix no longer needed)
- **Files modified:** src/presentation/components/floorplan/FloorPlanViewer.tsx
- **Verification:** npx tsc --noEmit — zero new errors

## Issues Encountered

- Pre-existing TypeScript errors in App.debug.tsx (3 errors), CsvExportService.ts (1 error), and SqliteAssetRepository.ts (5 errors) remain unchanged from before this plan. Zero new errors introduced.

## User Setup Required

None - no external service configuration required.

## Checkpoint Pending

Task 3 is a human verification checkpoint. The user needs to run `npm run tauri dev` and verify all 9 test scenarios covering the complete marker management end-to-end flow.

## Self-Check: PASSED

- FOUND: `src/presentation/components/floorplan/MarkerEditPopup.tsx`
- FOUND: `src/presentation/components/floorplan/FloorPlanViewer.tsx` (updated)
- FOUND: `src/presentation/components/floorplan/FloorPlanList.tsx` (updated)
- FOUND: `src/presentation/components/floorplan/index.ts` (updated)
- FOUND commit: `46e249e` (feat(06-05): add MarkerEditPopup and wire full FloorPlanViewer integration)
- FOUND commit: `84c3949` (feat(06-05): refresh marker count badge on FloorPlanCard after viewer navigation)

---
*Phase: 06-marker-management*
*Completed: 2026-02-19*
