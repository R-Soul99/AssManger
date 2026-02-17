---
phase: 05-floor-plan-viewer
plan: 03
subsystem: marker-rendering
tags: [canvas-drawing, marker-service, useMarkers, normalized-coordinates, category-styling]

dependency-graph:
  requires: ["05-02-canvas-pan-zoom", "IMarkerRepository", "IAssetRepository", "ICategoryRepository"]
  provides: ["MarkerService", "MarkerWithDetails", "useMarkers", "canvas-marker-rendering", "click-detection"]
  affects: ["05-04-marker-popups", "05-05-filtering"]

tech-stack:
  added: []
  patterns: ["parallel-data-fetching", "lazy-repository-initialization", "normalized-coordinate-transform", "canvas-hit-testing"]

file-tracking:
  created:
    - "src/application/services/MarkerService.ts"
    - "src/presentation/hooks/useMarkers.ts"
  modified:
    - "src/presentation/components/floorplan/FloorPlanCanvas.tsx"

decisions:
  - id: "lazy-repo-init"
    title: "Lazy getter pattern for repositories in MarkerService"
    rationale: "Singleton instantiated at module load, before DB connection exists. Lazy getters defer repo access until method call."
  - id: "parallel-asset-category-fetch"
    title: "Promise.all for asset+category joins"
    rationale: "Parallel fetching reduces total load time for floors with many markers"
  - id: "marker-visual-design"
    title: "Filled circle with category color + initial letter as icon"
    rationale: "Claude's discretion: maximizes readability at small sizes, color differentiates categories, letter adds secondary identification"
  - id: "markers-scale-with-zoom"
    title: "Markers drawn in canvas coordinate space (scale with zoom)"
    rationale: "CONTEXT.md decision: markers grow/shrink naturally with floor plan, natural feel"

metrics:
  completed: "2026-02-13"
---

# Phase 05 Plan 03: Marker Rendering Summary

**One-liner:** Created MarkerService (enriched marker joins), useMarkers hook, and canvas marker rendering with category colors, initial-letter icons, click detection, and selection ring.

## What Was Built

### MarkerService (Task 1)
- `getMarkersWithDetails(floorPlanId)`: fetches all markers, then parallel-fetches asset+category for each
- `MarkerWithDetails` type: `{ ...Marker, assetName, assetTag, assetStatus, serialNumber, categoryName, categoryColor, categoryIcon }`
- Missing asset → skip marker with console.warn
- Missing category → default gray color `#757575`
- Lazy getters for markerRepo, assetRepo, categoryRepo (prevents startup errors)
- Singleton: `export const markerService = new MarkerService()`

**Post-plan fix (c24405b):** Initial implementation used constructor-assigned repos — caused "requires database connection" error at app load. Fixed to use lazy getter pattern.

### useMarkers hook (Task 2)
- `useMarkers(floorPlanId: string | null)`
- Returns `{ markers, loading, error }`
- useEffect refetches when `floorPlanId` changes
- Returns `[]` when no floorPlanId

### Canvas Marker Rendering (Task 3)
- `drawMarker(ctx, marker, canvasWidth, canvasHeight)`:
  - `x = marker.x * canvasWidth`, `y = marker.y * canvasHeight`
  - Filled circle (radius 12) in `category.color`
  - White text: first letter of category name, centered
  - Black border ring when marker is selected
- Canvas redraws on markers change or selectedMarkerId change
- Click handler: iterates markers to find hit within radius 12
- `selectedMarkerId` state tracks current selection

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Create MarkerService | 75f44b2 |
| 2 | Create useMarkers hook | fb27fe7 |
| 3 | Render markers on canvas with click detection | 8b3045b |
| Fix | Lazy repository initialization in MarkerService | c24405b |

## Deviations from Plan

**1. Lazy initialization fix required post-commit**
- MarkerService singleton initialized at module load time before DB connection
- Fix applied in c24405b: changed constructor assignments to lazy getter properties
- Required because RepositoryFactory returns null when no project open

## Verification Results

- Markers visible at correct positions on canvas
- Category colors displayed correctly
- Click detection works, selection ring appears
- TypeScript compilation: No errors

## Next Phase Readiness

### Enables
- **05-04 (Marker Popups):** `selectedMarkerId` state and click handler ready for popup trigger
- **05-05 (Filtering):** `markers` array available for filtering by category/status

### Blockers/Concerns
None. Lazy initialization fix resolved startup issue.
