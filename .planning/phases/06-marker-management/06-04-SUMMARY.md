---
phase: 06-marker-management
plan: 04
subsystem: ui
tags: [react, mui, autocomplete, react-hook-form, zod, dialog, asset-management, markers]

# Dependency graph
requires:
  - phase: 06-marker-management
    plan: 01
    provides: MarkerService.placeMarker singleton for onLink callback
  - phase: 06-marker-management
    plan: 03
    provides: PlaceholderMarker interface from FloorPlanCanvas, selectedPlaceholder state in FloorPlanViewer

provides:
  - AssetLinkDialog component (searchable MUI Autocomplete, "Create new asset" toggle, onLink/onDiscard/onClose callbacks)
  - QuickCreateAssetForm component (react-hook-form + zod, tag+category required, description+location optional)
  - PlaceholderMarker type re-exported from floorplan index.ts

affects:
  - 06-05 (MarkerEditPopup integration — FloorPlanViewer will wire AssetLinkDialog to selectedPlaceholder)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AssetLinkDialog: load-all assets on open via assetRepository.findAll() with MUI Autocomplete + createFilterOptions(limit:50)
    - QuickCreateAssetForm: react-hook-form + zodResolver with z.string().optional() for non-required fields inside Dialog
    - CreateAssetDto.locationId made optional (string | undefined) to support minimal-friction asset creation flow

key-files:
  created:
    - src/presentation/components/floorplan/AssetLinkDialog.tsx
    - src/presentation/components/floorplan/QuickCreateAssetForm.tsx
  modified:
    - src/presentation/components/floorplan/index.ts
    - src/application/services/AssetService.ts

key-decisions:
  - "AssetLinkDialog fetches all assets on open (not on dialog mount) to ensure fresh data on each open"
  - "QuickCreateAssetForm uses useState pattern for categories/locations + react-hook-form+zod for form fields — hybrid approach consistent with existing patterns"
  - "description fallback to tag value if user omits it (entity requires min(1) description — silent UX fill)"
  - "CreateAssetDto.locationId changed to optional (string | undefined) to enable plan-specified optional location field"
  - "Zod v4 syntax fix: z.number().min(1, msg) instead of z.number({ required_error }) which is Zod v3 API"

patterns-established:
  - "Autocomplete + createFilterOptions pattern: import from '@mui/material/Autocomplete', pass filterOptions prop for client-side search with limit"
  - "Optional nullable select: Controller with value={field.value ?? ''} + onChange mapping '' back to null"

requirements-completed: [MRK-02, MRK-03]

# Metrics
duration: 12min
completed: 2026-02-19
---

# Phase 6 Plan 04: AssetLinkDialog and QuickCreateAssetForm Summary

**MUI Autocomplete asset search dialog + minimal-friction quick-create form with react-hook-form/zod, wired to MarkerService.placeMarker callback chain**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-02-19T08:01:21Z
- **Completed:** 2026-02-19T08:13:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- AssetLinkDialog: searchable Autocomplete (createFilterOptions, limit 50, tag+description search), "Create new asset" button inline-renders QuickCreateAssetForm, onDiscard cleans up placeholder on dismiss
- QuickCreateAssetForm: react-hook-form + zod schema with tag (required), category (required), description (optional — z.string().optional()), location (optional — z.string().nullable().optional()), Controller for Select fields
- Floorplan index.ts now exports AssetLinkDialog, QuickCreateAssetForm, and re-exports PlaceholderMarker type
- Auto-fixed: CreateAssetDto.locationId made optional to support optional location in quick-create form

## Task Commits

Each task was committed atomically:

1. **Task 1: AssetLinkDialog with searchable asset list** - `90a8791` (feat)
2. **Task 2: QuickCreateAssetForm and index.ts exports** - `569a2a4` (feat)

## Files Created/Modified

- `src/presentation/components/floorplan/AssetLinkDialog.tsx` - Dialog with MUI Autocomplete (all assets, createFilterOptions limit 50), inline QuickCreateAssetForm toggle, onLink/onDiscard/onClose callbacks
- `src/presentation/components/floorplan/QuickCreateAssetForm.tsx` - Inline form (no Dialog wrapper), react-hook-form + zod, tag required, category required via Controller+Select, description optional, location optional with "None — assign later" option
- `src/presentation/components/floorplan/index.ts` - Added AssetLinkDialog, QuickCreateAssetForm exports, PlaceholderMarker type re-export
- `src/application/services/AssetService.ts` - CreateAssetDto.locationId changed from `string` to `string | undefined`; service maps undefined to '' (entity validation catches it and returns ServiceResult error)

## Decisions Made

- AssetLinkDialog fetches assets on `open` state change (not on component mount) so each open shows fresh data
- QuickCreateAssetForm uses hybrid pattern: useState for categories/locations data loading (like CreateAssetForm.tsx), react-hook-form+zod for form field management (like AssetDetailDrawer.tsx)
- If description is omitted, the submit handler falls back to using the tag value as description — this silently satisfies the entity's `description: z.string().min(1)` requirement without requiring the user to fill it
- Location field shows "None — assign later" as first option; if not selected, locationId is not passed to the DTO
- Zod v4 fix: `z.number({ required_error })` is Zod v3 API; changed to `z.number().min(1, 'message')`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] CreateAssetDto.locationId made optional**
- **Found during:** Task 2 (QuickCreateAssetForm implementation)
- **Issue:** Plan specifies location as optional in QuickCreateAssetForm, but CreateAssetDto.locationId was typed as `string` (required) — TypeScript would not allow omitting it from the DTO call
- **Fix:** Changed `locationId: string` to `locationId?: string` in CreateAssetDto; service maps `undefined` to `''` so entity validation returns a clear error if user submits without location
- **Files modified:** src/application/services/AssetService.ts
- **Verification:** npx tsc --noEmit shows zero new errors
- **Committed in:** `569a2a4` (Task 2 commit)

**2. [Rule 1 - Bug] Zod v4 syntax fix for required_error**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `z.number({ required_error: 'Category is required' })` is Zod v3 API; project uses Zod v4.3.6 which does not support this parameter
- **Fix:** Changed to `z.number().min(1, 'Category is required')`
- **Files modified:** src/presentation/components/floorplan/QuickCreateAssetForm.tsx
- **Verification:** npx tsc --noEmit passes with no new errors
- **Committed in:** `569a2a4` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both fixes required for type safety and runtime correctness. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in App.debug.tsx (3 errors), CsvExportService.ts (1 error), and SqliteAssetRepository.ts (5 errors) remain unchanged from before this plan. Zero new errors introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 05 (MarkerEditPopup): FloorPlanViewer needs to wire AssetLinkDialog to `_selectedPlaceholder` state — when user clicks a placeholder, open AssetLinkDialog; onLink calls `markerService.placeMarker(floorPlanId, assetId, x, y)` then `refreshMarkers()`
- AssetLinkDialog and QuickCreateAssetForm are standalone — no additional wiring needed beyond parent integration in Plan 05
- Both components follow established MUI + RepositoryFactory patterns and are ready for production use

## Self-Check: PASSED

- FOUND: `src/presentation/components/floorplan/AssetLinkDialog.tsx`
- FOUND: `src/presentation/components/floorplan/QuickCreateAssetForm.tsx`
- FOUND: `src/presentation/components/floorplan/index.ts` (updated)
- FOUND: `src/application/services/AssetService.ts` (updated)
- FOUND commit: `90a8791` (feat(06-04): add AssetLinkDialog with searchable asset combobox)
- FOUND commit: `569a2a4` (feat(06-04): add QuickCreateAssetForm and update floorplan index exports)

---
*Phase: 06-marker-management*
*Completed: 2026-02-19*
