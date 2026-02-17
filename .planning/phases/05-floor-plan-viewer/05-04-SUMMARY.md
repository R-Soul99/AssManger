---
phase: 05-floor-plan-viewer
plan: 04
subsystem: marker-popups
tags: [react-laag, popup, asset-summary, navigation, AssetDetailDrawer, edge-detection]

dependency-graph:
  requires: ["05-03-marker-rendering", "AssetDetailDrawer", "AssetService"]
  provides: ["MarkerPopup", "marker-click-navigation", "asset-detail-integration"]
  affects: ["05-05-filtering"]

tech-stack:
  added: ["react-laag@2.0.5"]
  patterns: ["layer-based-popup", "edge-aware-positioning", "callback-navigation"]

file-tracking:
  created:
    - "src/presentation/components/floorplan/MarkerPopup.tsx"
  modified:
    - "src/presentation/components/floorplan/FloorPlanCanvas.tsx"
    - "src/presentation/components/floorplan/FloorPlanViewer.tsx"
    - "src/presentation/components/floorplan/index.ts"
    - "package.json"
    - "package-lock.json"

decisions:
  - id: "react-laag-positioning"
    title: "react-laag useLayer for smart popup positioning"
    rationale: "Claude's discretion: handles automatic repositioning near viewport edges, prevents popup clipping"
  - id: "selectedMarker-full-object"
    title: "selectedMarker stores full MarkerWithDetails (not just ID)"
    rationale: "Popup needs all asset/category data without additional fetch — full object eliminates extra async call"
  - id: "status-chip-colors"
    title: "Color-coded status chips: green/red/yellow/default"
    rationale: "Claude's discretion: visual status differentiation matches common UX patterns"
  - id: "popup-closes-on-drawer-open"
    title: "Popup dismisses when AssetDetailDrawer opens"
    rationale: "Prevents UI clutter — user's intent is to view full details, popup is redundant"

metrics:
  completed: "2026-02-13"
---

# Phase 05 Plan 04: Interactive Marker Popups Summary

**One-liner:** Created MarkerPopup with react-laag edge-aware positioning, asset summary display, and View Details navigation to AssetDetailDrawer.

## What Was Built

### react-laag Installation (Task 1)
- `react-laag@2.0.5` installed
- Provides `useLayer` hook for popup positioning with automatic edge detection

### MarkerPopup Component (Task 2)
`src/presentation/components/floorplan/MarkerPopup.tsx` (139 lines):
- Props: `marker: MarkerWithDetails`, `anchorEl` (DOM element), `onClose`, `onViewDetails`
- react-laag `useLayer` handles positioning above marker, auto-repositions near viewport edges
- Category badge: colored circle with category initial letter
- Status chips: MUI Chip with color variants (green=Active, red=Decommissioned, yellow=Faulty)
- Serial number row (conditional — only shown if not null)
- "View Details" button triggers `onViewDetails(marker.assetId)`
- X close button top-right; click-outside via react-laag `onOutsideClick`

### Popup + Navigation Integration (Task 3)
- `FloorPlanCanvas`: `selectedMarkerId` → `selectedMarker: MarkerWithDetails | null`; `onMarkerClick` callback prop
- `FloorPlanViewer`: manages `selectedMarker` state, renders `<MarkerPopup>` when selected
- Screen position calculated: marker normalized coords × canvas element client dimensions
- `AssetDetailDrawer` rendered in FloorPlanViewer; triggered by `onViewDetails`
- Popup closes (`setSelectedMarker(null)`) when drawer opens

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Install react-laag | d206dd9 |
| 2 | Create MarkerPopup component | 1e049e2 |
| 3 | Integrate popup + AssetDetailDrawer in viewer | 25b94ae |

## Deviations from Plan

None — implementation matched plan exactly.

## Verification Results

- Marker click → popup appears with correct asset info
- Popup repositions correctly near viewport edges
- Close + click-outside both dismiss popup
- View Details → AssetDetailDrawer opens with correct asset
- TypeScript compilation: No errors

## Next Phase Readiness

### Enables
- **05-05 (Filtering):** Canvas and viewer state management ready for filter prop integration

### Blockers/Concerns
None.
