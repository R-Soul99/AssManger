---
phase: 04-floor-plan-management
plan: 02
subsystem: presentation-floorplan-import
tags: [mui-dialog, canvas-api, tiff.js, image-conversion, file-picker, tauri-fs]

dependency-graph:
  requires: ["04-01-service-layer", "LocalFileStorage", "FloorPlanService"]
  provides: ["FloorPlanImportDialog", "imageUtils", "tiff-type-declaration"]
  affects: ["04-03-card-list"]

tech-stack:
  added: ["tiff.js"]
  patterns: ["phase-driven-ui", "canvas-image-processing", "object-url-cleanup", "unique-filename-generation"]

file-tracking:
  created:
    - "src/presentation/components/floorplan/FloorPlanImportDialog.tsx"
    - "src/presentation/components/floorplan/utils/imageUtils.ts"
    - "src/presentation/components/floorplan/index.ts"
    - "src/types/tiff.d.ts"
  modified: []

decisions:
  - id: "fp-canvas-image-decode"
    title: "Canvas API for image decode and resize"
    rationale: "Browser's createImageBitmap + canvas.toBlob provides reliable cross-format conversion to PNG without external dependencies"
  - id: "fp-tiff-via-js"
    title: "tiff.js for TIFF decoding"
    rationale: "Browser lacks native TIFF support; tiff.js decodes to RGBA array, render via canvas, then process like other formats"
  - id: "fp-max-dimension-4096"
    title: "Max 4096px auto-resize"
    rationale: "Prevents memory issues with very large images; maintains aspect ratio; typical floor plans fit comfortably under this limit"
  - id: "fp-preview-object-url"
    title: "Object URL for preview with useEffect cleanup"
    rationale: "Avoids memory leaks from blob URLs; cleanup in useEffect dependency on convertedImage ensures revocation on image change or unmount"
  - id: "fp-location-deferred"
    title: "Location assignment deferred to detail view"
    rationale: "CONTEXT decision: importFloorPlan creates record with null locationId; user assigns location later in FloorPlanList/DetailDrawer"

metrics:
  completed: "2026-02-05"
  duration: "5min"
---

# Phase 04 Plan 02: Floor Plan Import Workflow Summary

**One-liner:** FloorPlanImportDialog with canvas-based image processing, TIFF support via tiff.js, auto-resize to 4096px max, and PNG conversion before storage.

## What Was Built

### Image Utilities (Task 2)
- **pickFloorPlanImage()**: Opens system file picker with filters for PNG, JPEG, JPG, BMP, TIF, TIFF; returns `{ data: Uint8Array, fileName: string }` or null on cancel
- **loadAndConvertImage()**:
  - TIFF: decode via tiff.js → RGBA array → canvas → ImageBitmap
  - PNG/JPEG/BMP: Blob → createImageBitmap (native browser decode)
  - Auto-resize if width or height > 4096px (maintains aspect ratio)
  - Convert to PNG via canvas.toBlob
  - Returns `{ blob, width, height, outputName, previewUrl }`
- **saveConvertedImage()**: Writes PNG blob to floor_plans directory with unique naming; returns relative path `floor_plans/{filename}.png`
- **Type declaration (tiff.d.ts)**: Created `declare module 'tiff.js'` with TiffPage interface to satisfy TypeScript strict mode
- **ArrayBuffer handling**: Used `.buffer.slice()` with `as ArrayBuffer` cast to convert Uint8Array.buffer (ArrayBufferLike) to ArrayBuffer for tiff.js and Blob constructor

### FloorPlanImportDialog (Task 3)
- **Phase-driven UI**: 'pick' → 'processing' → 'preview' → 'saving' → 'error'
- **Pick phase**: Displays "Choose File" button with format description
- **Processing phase**: CircularProgress + "Processing image..." message
- **Preview phase**:
  - Image preview (max 200px height, contained fit)
  - Dimensions display (e.g., "1024 x 768 pixels")
  - Name TextField (defaults to filename without extension; helper text: "Optional - defaults to filename if left blank")
  - Import button enabled
- **Saving phase**: CircularProgress + "Saving floor plan..." message
- **Error phase**: Alert with error message + "Try Again" button resets to 'pick'
- **Object URL cleanup**: useEffect with convertedImage dependency revokes URL on unmount or image change
- **Import workflow**:
  1. saveConvertedImage → returns relativePath
  2. FloorPlanService.importFloorPlan({ name, imageRelativePath, imageWidth, imageHeight })
  3. onImported callback → onClose
- **Location assignment**: Omitted from import (locationId: null) — assigned later in detail view per CONTEXT decision

### Barrel Export (Task 3)
- `src/presentation/components/floorplan/index.ts` exports `FloorPlanImportDialog`

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install tiff.js dependency | (cbe9ef7) | package.json (already installed) |
| 2 | Create image utility functions | 6ca448a | imageUtils.ts, tiff.d.ts |
| 3 | Create FloorPlanImportDialog component | 8c50523 | FloorPlanImportDialog.tsx, index.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] tiff.js type declaration**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** tiff.js has no @types package; TypeScript strict mode requires declaration
- **Fix:** Created `src/types/tiff.d.ts` with `TiffPage` interface and `decode()` export
- **Files modified:** src/types/tiff.d.ts (created)
- **Commit:** 6ca448a (bundled with Task 2)

**2. [Rule 1 - Bug] ArrayBuffer type mismatch**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `Uint8Array.buffer` is `ArrayBufferLike` (ArrayBuffer | SharedArrayBuffer) in strict mode; tiff.js and Blob expect `ArrayBuffer`
- **Fix:** Used `.buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer` to extract proper ArrayBuffer
- **Files modified:** src/presentation/components/floorplan/utils/imageUtils.ts
- **Commit:** 6ca448a (bundled with Task 2)

No other deviations.

## Verification Results

- TypeScript compilation: No errors in FloorPlanImportDialog or imageUtils
- tiff.js installed and in package.json dependencies
- FloorPlanImportDialog exported from barrel (can import via `@/presentation/components/floorplan`)
- File picker filter matches plan spec: png, jpeg, jpg, bmp, tif, tiff
- Image processing flow: pick → decode → resize (if >4096px) → convert to PNG → preview
- Preview URL cleanup via useEffect prevents memory leaks
- Import creates FloorPlan record with null locationId (location assigned later)

## Next Phase Readiness

### Enables
- **04-03 (Card List):** FloorPlanImportDialog ready to wire into "Import Floor Plan" button
- Import workflow tested with mock repository (04-01)

### Blockers/Concerns
None. All 04-02 success criteria met.
