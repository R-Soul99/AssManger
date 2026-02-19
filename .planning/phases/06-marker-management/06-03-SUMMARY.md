---
phase: 06-marker-management
plan: 03
subsystem: ui
tags: [react, canvas, markers, edit-mode, drag, placeholder, uuid]

# Dependency graph
requires:
  - phase: 06-marker-management
    plan: 01
    provides: MarkerService.moveMarker singleton, useMarkers markerVersion parameter
  - phase: 06-marker-management
    plan: 02
    provides: isEditMode state in FloorPlanViewer, FloorPlanCanvas prop wiring point

provides:
  - PlaceholderMarker interface (exported from FloorPlanCanvas)
  - drawPlaceholderMarker canvas renderer (dashed circle + icon, selection highlight)
  - FloorPlanCanvas edit mode: click-to-place placeholder, drag-to-reposition linked markers
  - FloorPlanCanvas Space+drag panning via TransformWrapper activationKeys
  - FloorPlanViewer placeholders state (PlaceholderMarker[])
  - FloorPlanViewer markerVersion state + refreshMarkers() trigger for post-mutation re-fetch

affects:
  - 06-04 (AssetLinkDialog reads selectedPlaceholder from FloorPlanViewer)
  - 06-05 (MarkerEditPopup reads onMarkerEditSelect callback)

# Tech tracking
tech-stack:
  added:
    - uuid v4 (already installed; now imported in FloorPlanCanvas for placeholder IDs)
  patterns:
    - dragStateRef pattern: useRef<DragState> with activated flag + 6px threshold to distinguish click from drag
    - PlaceholderMarker interface with isPlaceholder literal type discriminant
    - TransformWrapper activationKeys for Space+drag panning in edit mode
    - Underscore-prefixed state (_selectedPlaceholder) for future-consumed state to pass noUnusedLocals

key-files:
  created: []
  modified:
    - src/presentation/components/floorplan/FloorPlanCanvas.tsx
    - src/presentation/components/floorplan/FloorPlanViewer.tsx

key-decisions:
  - "Tasks 1 and 2 implemented together in a single write since both target FloorPlanCanvas.tsx — cleaner than partial writes"
  - "_selectedPlaceholder prefix used to satisfy noUnusedLocals while keeping state in FloorPlanViewer for Plan 04 consumption"
  - "MarkerPopup conditionally rendered only in view mode (!isEditMode) to prevent popup appearing during edit interactions"
  - "DragState interface defined inside component (not exported) — internal implementation detail only"

patterns-established:
  - "dragStateRef + DRAG_ACTIVATION_DISTANCE: distinguishes click from drag without useState (no re-render on mouse move)"
  - "screenToCanvas helper: converts React MouseEvent clientX/Y to canvas logical coordinates accounting for display scaling"
  - "findHitAtPosition: unified hit detection for both linked markers and placeholder markers"

requirements-completed: [MRK-01, MRK-04, MRK-06, MRK-07, MRK-08]

# Metrics
duration: 7min
completed: 2026-02-19
---

# Phase 6 Plan 03: Canvas Edit Mode Interactions Summary

**Canvas edit mode wired: click-to-place placeholder markers (dashed circle + icon), drag-to-reposition linked markers via MarkerService.moveMarker, and Space+drag panning via TransformWrapper activationKeys**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-02-19T07:50:56Z
- **Completed:** 2026-02-19T07:57:58Z
- **Tasks:** 3 (Tasks 1+2 combined into single file write)
- **Files modified:** 2

## Accomplishments

- Exported `PlaceholderMarker` interface from FloorPlanCanvas (id, normalizedX, normalizedY, isPlaceholder: true)
- Added `drawPlaceholderMarker()` function: dashed circle (setLineDash([4,3])), "+" text icon, blue (#1976d2) when selected / grey (#666666) when unselected
- Added `DragState` interface and `dragStateRef` useRef for zero-re-render drag tracking with 6px activation threshold
- Added `handleMouseDown/Move/Up` event handlers — mouseUp calls `markerService.moveMarker()` + fires `onMarkerMoved` if drag activated
- Updated `handleCanvasClick` for edit mode: empty space → `onPlaceholderPlaced`, linked marker → `onMarkerEditSelect`, placeholder → `onPlaceholderSelect`
- Updated TransformWrapper `panning` prop: `{ activationKeys: [' '] }` in edit mode, `{ disabled: false }` in view mode
- Canvas cursor: `crosshair` in edit mode, `pointer` in view mode
- MarkerPopup now only renders in view mode (`!isEditMode && selectedMarker`)
- Added `placeholders`, `selectedPlaceholder`, `markerVersion` state to FloorPlanViewer
- `useMarkers(floorPlanId, markerVersion)` — markerVersion increment triggers re-fetch after move
- All 6 new props wired from FloorPlanViewer to FloorPlanCanvas

## Task Commits

Each task was committed atomically:

1. **Tasks 1+2: FloorPlanCanvas edit mode interactions** - `49db57d` (feat)
2. **Task 3: FloorPlanViewer placeholder state and markerVersion** - `cb9f7b4` (feat)

## Files Created/Modified

- `src/presentation/components/floorplan/FloorPlanCanvas.tsx` - PlaceholderMarker interface, drawPlaceholderMarker, DragState, dragStateRef, handleMouseDown/Move/Up, updated handleCanvasClick, updated TransformWrapper panning, crosshair cursor, new props, markerService import, uuid import
- `src/presentation/components/floorplan/FloorPlanViewer.tsx` - PlaceholderMarker import, placeholders state, _selectedPlaceholder state, markerVersion state, refreshMarkers(), useMarkers with markerVersion, 6 new FloorPlanCanvas props wired

## Decisions Made

- Tasks 1 and 2 were implemented together in a single write to FloorPlanCanvas.tsx (both target the same file — partial writes would require re-reads and are error-prone)
- `_selectedPlaceholder` prefix used to satisfy TypeScript `noUnusedLocals: true` while keeping the state variable in FloorPlanViewer where Plan 04 will consume it — same deferred-prop pattern used in Plan 06-02
- `MarkerPopup` is now conditionally rendered with `!isEditMode &&` guard — prevents popup showing when user clicks markers in edit mode (edit mode has its own `onMarkerEditSelect` callback)
- `DragState` interface defined inside component, not exported — it's an implementation detail of the event handler logic

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in `App.debug.tsx` (3 errors), `CsvExportService.ts` (1 error), and `SqliteAssetRepository.ts` (5 errors) remain from before this plan. Zero new errors introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 (AssetLinkDialog): reads `_selectedPlaceholder` state from FloorPlanViewer, calls `markerService.placeMarker()`, then calls `refreshMarkers()` to update the canvas
- Plan 05 (MarkerEditPopup): implements `onMarkerEditSelect` callback body (currently logs), uses `markerService.moveMarker/deleteMarker/relinkMarker`
- Canvas interaction layer is fully functional: clicking empty space places placeholder, dragging linked marker repositions it, Space+drag pans in edit mode

## Self-Check: PASSED

- FOUND: `src/presentation/components/floorplan/FloorPlanCanvas.tsx`
- FOUND: `src/presentation/components/floorplan/FloorPlanViewer.tsx`
- FOUND: `.planning/phases/06-marker-management/06-03-SUMMARY.md`
- FOUND commit: `49db57d` (feat(06-03): add edit mode interactions to FloorPlanCanvas)
- FOUND commit: `cb9f7b4` (feat(06-03): wire placeholder state and markerVersion into FloorPlanViewer)

---
*Phase: 06-marker-management*
*Completed: 2026-02-19*
