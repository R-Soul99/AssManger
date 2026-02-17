---
phase: 05-floor-plan-viewer
plan: 05
subsystem: filtering-and-navigation
tags: [category-filter, status-filter, toolbar, sidebar, navigation, MUI-v7]

dependency-graph:
  requires: ["05-04-marker-popups", "FloorPlanCard", "FloorPlanList"]
  provides: ["FloorPlanViewerToolbar", "FloorPlanFilterSidebar", "category-visibility", "status-dimming", "viewer-navigation"]
  affects: []

tech-stack:
  added: []
  patterns: ["controlled-filter-state", "opacity-dimming", "ListItemButton-MUI-v7", "absolute-positioned-overlay"]

file-tracking:
  created:
    - "src/presentation/components/floorplan/FloorPlanViewerToolbar.tsx"
    - "src/presentation/components/floorplan/FloorPlanFilterSidebar.tsx"
  modified:
    - "src/presentation/components/floorplan/FloorPlanCanvas.tsx"
    - "src/presentation/components/floorplan/FloorPlanViewer.tsx"
    - "src/presentation/components/floorplan/FloorPlanCard.tsx"
    - "src/presentation/components/floorplan/FloorPlanList.tsx"
    - "src/presentation/components/floorplan/index.ts"

decisions:
  - id: "dim-not-hide"
    title: "30% opacity for filtered markers (not hidden)"
    rationale: "CONTEXT.md decision: preserves spatial context while focusing attention on matching markers"
  - id: "hybrid-filter-layout"
    title: "Category chips in toolbar (always visible) + status in collapsible sidebar"
    rationale: "CONTEXT.md decision: frequent category toggling needs constant access; status filter used less often"
  - id: "select-all-none"
    title: "Select All / None buttons for category visibility"
    rationale: "CONTEXT.md decision: quick reset capability for common workflow of 'show everything' or 'isolate one category'"
  - id: "toolbar-positioning"
    title: "Toolbar at left: 80 (not 16) to clear back button"
    rationale: "Post-plan fix: initial left: 16 hidden behind back button (also top-left)"

metrics:
  completed: "2026-02-13"
---

# Phase 05 Plan 05: Filtering and Visibility Controls Summary

**One-liner:** Created FloorPlanViewerToolbar (category chips) and FloorPlanFilterSidebar (status filter), integrated 30% opacity dimming into canvas, wired View/Edit buttons in FloorPlanCard, and added back navigation to FloorPlanViewer.

## What Was Built

### FloorPlanViewerToolbar (Task 1)
`src/presentation/components/floorplan/FloorPlanViewerToolbar.tsx` (116 lines):
- Category chips: colored MUI Chip per category, greyed when hidden
- All / None bulk toggle buttons
- FilterList icon button toggles sidebar open/close
- Positioned absolute at top-left, `left: 80` (clears back button), `right: 80` (clears zoom controls)

### FloorPlanFilterSidebar (Task 2)
`src/presentation/components/floorplan/FloorPlanFilterSidebar.tsx` (113 lines):
- MUI Drawer on right side, `variant="persistent"`, collapsible
- Status options: All, Active, Inactive, Faulty, Decommissioned
- `ListItemButton` used (MUI v7 — `ListItem button` prop removed)
- Color-coded left border per status
- Marker count badge per status option
- Checkmark on selected status

### Canvas Filtering Integration (Task 3)
Updated `FloorPlanCanvas`:
- `visibleCategories: Set<string>`, `selectedStatus: string | null` props
- `drawMarker`: `ctx.globalAlpha = isVisible ? 1.0 : 0.3` before drawing
- Dimmed markers remain clickable (hit-testing unaffected by alpha)

Updated `FloorPlanViewer`:
- `visibleCategories` state: initialized from unique category IDs in markers
- `selectedStatus` state: null = show all
- `markerCounts` computed: `markers.reduce(...)` per status value
- `sidebarOpen` state for sidebar toggle

### Navigation Wiring (Task 4)
`FloorPlanCard.tsx`:
- Added View + Edit buttons in CardActions
- Hidden when `selectionMode` active
- View calls `onView(floorPlan.id)`

`FloorPlanList.tsx`:
- `viewingPlanId` state
- Renders `<FloorPlanViewer>` when set, `<FloorPlanList>` otherwise
- `onBack` callback resets `viewingPlanId` to null

`FloorPlanViewer.tsx`:
- Optional `onBack?: () => void` prop
- Back button (IconButton, same style as zoom controls) at top-left

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Create FloorPlanViewerToolbar | 23057b4 |
| 2 | Create FloorPlanFilterSidebar | 6c7cc3f |
| 3 | Integrate filtering with canvas rendering | bdc8028 |
| Fix | MUI v7: ListItem button → ListItemButton | 8a47c1a |
| 4a | Wire View/Edit buttons in FloorPlanCard + FloorPlanList routing | fd3c4c2 |
| Fix | Image loading (Blob URL) + DB connection (retry pattern) | 99b61bb |
| Fix | Toolbar positioning: left: 80 to clear back button | 768b441 |

## Deviations from Plan

**1. MUI v7 ListItemButton fix (8a47c1a)**
- `ListItem button` prop removed in MUI v7
- Replaced with `ListItemButton` component — minor API difference

**2. Image loading and DB connection fixes during verification (99b61bb)**
- `convertFileSrc()` produced invalid URLs in Tauri context → switched to `readFile + Blob URL` (same as working hook pattern)
- RepositoryFactory cached `db=null` on first call → added retry pattern: re-calls `getDatabase()` when null
- Applied to both MarkerRepository and CalibrationRepository

**3. Toolbar positioning fix (768b441)**
- Initial position `left: 16` hidden back button (both anchored top-left)
- Moved to `left: 80` to make room; added `right: 80` for balance with zoom controls

## Verification Results

- Category chips correctly toggle marker visibility
- Non-matching markers appear at 30% opacity
- Select All / None buttons work
- Sidebar opens/closes correctly
- View button on FloorPlanCard opens FloorPlanViewer
- Back button returns to FloorPlanList
- TypeScript compilation: No errors after MUI v7 fix

## Phase 5 Complete

All 7 success criteria achieved:
1. ✓ Pan (drag) + zoom (wheel/pinch) with direct feel
2. ✓ All markers displayed with category colors + initial-letter icons
3. ✓ Click marker → popup with name/tag/category/status
4. ✓ View Details button navigates to AssetDetailDrawer
5. ✓ Category chips toggle marker visibility
6. ✓ Status filter dims non-matching markers to 30%
7. ✓ Performance: load-all-markers approach (viewport culling deferred per CONTEXT.md — real usage first)
