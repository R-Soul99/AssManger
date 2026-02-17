---
phase: 05-floor-plan-viewer
plan: 02
subsystem: pan-zoom-controls
tags: [react-zoom-pan-pinch, pan, zoom, keyboard-shortcuts, forwardRef]

dependency-graph:
  requires: ["05-01-FloorPlanCanvas", "05-01-FloorPlanViewer"]
  provides: ["pan-zoom-interaction", "zoom-toolbar", "keyboard-shortcuts"]
  affects: ["05-03-marker-rendering", "05-04-marker-popups"]

tech-stack:
  added: ["react-zoom-pan-pinch@3.7.0"]
  patterns: ["forwardRef", "programmatic-transform-control", "keyboard-shortcut-handler"]

file-tracking:
  created: []
  modified:
    - "src/presentation/components/floorplan/FloorPlanCanvas.tsx"
    - "src/presentation/components/floorplan/FloorPlanViewer.tsx"
    - "package.json"
    - "package-lock.json"

decisions:
  - id: "velocity-animation-disabled"
    title: "velocityAnimation: false — no momentum/inertia on pan"
    rationale: "CONTEXT.md decision: direct and immediate feel, CAD-like precision control"
  - id: "zoom-range"
    title: "50%–500% zoom range (minScale: 0.5, maxScale: 5)"
    rationale: "Supports close inspection of dense marker areas and overall layout view"
  - id: "forwardRef-pattern"
    title: "FloorPlanCanvas converted to forwardRef for programmatic zoom"
    rationale: "Allows FloorPlanViewer to call zoomIn/zoomOut/reset on the TransformWrapper ref"

metrics:
  completed: "2026-02-13"
---

# Phase 05 Plan 02: Pan/Zoom Controls Summary

**One-liner:** Integrated react-zoom-pan-pinch with direct-feel pan/zoom, zoom toolbar (+/-/Reset), and keyboard shortcuts (arrows + +/-).

## What Was Built

### react-zoom-pan-pinch Integration (Task 1+2)
- Installed `react-zoom-pan-pinch@3.7.0`
- `FloorPlanCanvas` wrapped in `TransformWrapper` + `TransformComponent`
- Configuration: `velocityAnimation: false`, `minScale: 0.5`, `maxScale: 5`, wheel step `0.1`
- Double-click zoom disabled
- Canvas converted to `forwardRef` to expose TransformWrapper ref to parent

### Zoom Control Toolbar (Task 3)
- Positioned absolute at top-right of viewer
- Zoom In: calls `zoomIn()` on ref
- Zoom Out: calls `zoomOut()` on ref
- Reset: calls `resetTransform()` on ref
- MUI `IconButton` with `Tooltip` components
- Keyboard handler on viewer container: arrow keys for pan, `+`/`-` for zoom

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Install react-zoom-pan-pinch | 8c2660a |
| 2 | Wrap canvas in TransformWrapper with configuration | 61aa0ff |
| 3 | Add zoom toolbar with keyboard shortcuts | 140a9c4 |

## Deviations from Plan

None — implementation matched plan exactly.

## Verification Results

- TypeScript compilation: No errors
- Pan: drag moves floor plan directly with no momentum
- Zoom: mouse wheel and buttons work within 50%–500% range
- Keyboard shortcuts functional

## Next Phase Readiness

### Enables
- **05-03 (Marker Rendering):** Canvas draw context accessible within TransformWrapper
- **05-04 (Marker Popups):** Marker screen position calculable from TransformWrapper state

### Blockers/Concerns
None.
