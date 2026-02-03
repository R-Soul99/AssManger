---
phase: 03-asset-management-csv-export
plan: 02
subsystem: asset-detail-ui
tags: [react-hook-form, zod, mui-drawer, dirty-state, form-validation, floor-plan-markers]
requires: [03-01]
provides:
  - "Side-panel asset detail drawer with full inline editing and Zod validation"
  - "Dirty-state tracking with unsaved-changes confirmation dialog"
  - "Floor Plan Markers placeholder section wired for Phase 6 population"
affects: [03-03, 06-01]
tech-stack:
  added: [react-hook-form, @hookform/resolvers]
  patterns:
    - "Controller-per-field pattern for MUI + React Hook Form integration"
    - "Form schema aligned to UI value types (empty string not undefined) with DTO conversion at submit"
    - "Event stopPropagation on nested action buttons inside clickable rows"
key-files:
  created:
    - src/presentation/components/asset/AssetDetailDrawer.tsx
  modified:
    - src/presentation/components/asset/AssetList.tsx
    - src/presentation/components/asset/index.ts
    - src/domain/validators/index.ts
    - src/infrastructure/repositories/interfaces/index.ts
decisions:
  - decision: "Form schema uses z.string() for all text fields (not .optional()) because TextFields always hold a string value; conversion to optional DTO fields happens in the submit handler"
    rationale: "zodResolver infers types from the schema; using .optional() produces string | undefined which conflicts with the React Hook Form field type expectations for controlled MUI TextFields that always have a value"
    impact: "Eliminates resolver/form-type mismatch; keeps form logic simple with a single DTO mapping step at submit"
  - decision: "Standalone edit button removed from asset list rows; row click opens detail drawer instead"
    rationale: "Drawer provides richer editing experience with all fields visible; avoids two competing edit entry points"
    impact: "Simpler row actions column (delete only); drawer is the single path to asset editing"
  - decision: "assignableLocations filtered to Room/Floor types before passing to drawer"
    rationale: "Assets belong to physical spaces (rooms and floors); consistent with CreateAssetForm filtering established in Plan 02-04"
    impact: "Location selector in drawer shows only valid assignment targets"
metrics:
  duration: 4min
  completed: 2026-02-03
---

# Phase 03 Plan 02: Asset Detail Drawer Summary

MUI Drawer component with React Hook Form integration, Zod validation, inline error display, unsaved-changes confirmation dialog, and a Floor Plan Markers placeholder section -- all wired into the asset list via row-click selection.

## What Was Built

**AssetDetailDrawer.tsx (597 lines)** -- A right-anchored MUI Drawer that opens when the user clicks any asset row in the list. The drawer contains:

- A form built with React Hook Form `Controller` components wrapping every MUI field (TextField, Select). All 12 asset fields are editable: tag, description, category (with icon/color preview), location (with full hierarchical path), serial number, phone/extension, status, owner, cost centre, cost, purchase date, and notes.
- Zod validation via `zodResolver`. Validation errors appear as inline `helperText` under each field.
- `isDirty` tracking from React Hook Form's `formState`. The Save button is disabled when the form is clean or invalid.
- An unsaved-changes confirmation dialog triggered on any close attempt (X button, backdrop click, Cancel button) when the form is dirty. "Discard" resets and closes; "Cancel" returns to the form.
- A read-only Metadata section showing created and updated timestamps.
- A Floor Plan Markers section with a placeholder message ("No floor plan markers for this asset"). This section is positioned for Phase 6 to populate with actual marker data once floor plans are uploaded.
- Save handler calls `AssetService.updateAsset`, resets dirty state on success, triggers list refresh via `onSave`, and closes the drawer.

**AssetList.tsx integration:**

- Each `TableRow` is now clickable (`onClick` sets `selectedAsset`). Rows have `cursor: pointer` styling.
- The delete `IconButton` uses `e.stopPropagation()` so clicking delete does not also open the drawer.
- The standalone edit button was removed; the drawer is the single editing entry point.
- `assignableLocations` (Room/Floor only) is computed and passed to the drawer.
- `AssetDetailDrawer` is rendered at the bottom of the component, receiving `selectedAsset`, close/save callbacks, categories, and filtered locations.

**index.ts** re-exports `AssetDetailDrawer` from the asset component barrel.

## Technical Highlights

- **Form/schema type alignment:** The Zod schema uses `z.string()` (not `.optional()`) for all text fields because MUI TextFields are always controlled with a string value. The conversion from empty-string to `undefined` happens once, in the submit handler's DTO mapping. This avoids the common `zodResolver` type mismatch that occurs when schema-inferred types include `| undefined` but the form state type does not.
- **stopPropagation pattern:** The delete button's `onClick` calls `e.stopPropagation()` before invoking the delete handler. This prevents the row's own `onClick` from firing and opening the drawer when the user intends to delete.
- **Effect-driven reset:** A `useEffect` keyed on `asset?.asset.id` calls `reset(mapAssetToFormValues(asset))` whenever the selected asset changes. This ensures the form reflects the current asset without stale state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing `CategoryData` export from `src/domain/validators/index.ts`**

- **Found during:** Task 2 TypeScript verification
- **Issue:** `CategoryData` type was defined and exported from `schemas.ts` but not re-exported from the barrel `index.ts`. Multiple components (`AssetDetailDrawer`, `AssetList`, `AssetListToolbar`, `IAssetRepository`) import it from `@/domain/validators` and all failed to resolve.
- **Fix:** Added `CategoryData` and `CategorySchema` to the barrel export list.
- **Files modified:** `src/domain/validators/index.ts`
- **Commit:** c1dbb92

**2. [Rule 1 - Bug] Missing `AssetWithRelations` export from `src/infrastructure/repositories/interfaces/index.ts`**

- **Found during:** Task 2 TypeScript verification
- **Issue:** `AssetWithRelations` interface was defined in `IAssetRepository.ts` but not re-exported from the interfaces barrel. `AssetService.ts` imports it via the barrel path.
- **Fix:** Added `AssetWithRelations` to the barrel export.
- **Files modified:** `src/infrastructure/repositories/interfaces/index.ts`
- **Commit:** c1dbb92

**3. [Rule 1 - Bug] Zod schema / form type mismatch in AssetDetailDrawer**

- **Found during:** Task 2 TypeScript verification
- **Issue:** `UpdateAssetSchema` used `.optional()` on text fields producing `string | undefined`, but `UpdateAssetFormData` declared those fields as `string`. The `zodResolver` type did not match the explicit generic on `useForm`.
- **Fix:** Changed optional text fields to `z.string()` (form always has a value), changed cost to `z.union([z.number().positive(), z.literal('')])`, and replaced the explicit type with `z.infer<typeof UpdateAssetSchema>`.
- **Files modified:** `src/presentation/components/asset/AssetDetailDrawer.tsx`
- **Commit:** c1dbb92

## Next Steps

- **Plan 03-03** will build on the asset list and detail drawer to add CSV export functionality.
- **Phase 6** will populate the Floor Plan Markers section in `AssetDetailDrawer` with real marker data once floor plan upload and marker placement are implemented.
