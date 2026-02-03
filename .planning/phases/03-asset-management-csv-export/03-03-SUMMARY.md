---
phase: 03-asset-management-csv-export
plan: 03
subsystem: asset-management
tags: [columns, bulk-selection, bulk-delete, bulk-export, ui, localStorage]
requires: ["03-01-PLAN.md", "03-04-PLAN.md"]
provides:
  - "Configurable column visibility persisted to localStorage"
  - "Bulk selection with select-all and select-filtered"
  - "Bulk delete with confirmation dialog"
  - "Bulk export selected assets to CSV via CsvExportService"
affects: ["03-04"]
tech-stack:
  added: []
  patterns:
    - "localStorage persistence for UI preferences (read-on-init, write-on-toggle)"
    - "Bulk selection with indeterminate header checkbox"
    - "Conditional column rendering (removed from DOM, not CSS-hidden)"
    - "Sequential async delete loop for SQLite write safety"
key-files:
  created:
    - src/presentation/components/asset/hooks/useColumnVisibility.ts
    - src/presentation/components/asset/AssetBulkActions.tsx
    - src/application/services/CsvExportService.ts (stub for parallel 03-04)
  modified:
    - src/presentation/components/asset/AssetList.tsx
    - src/presentation/components/asset/AssetListToolbar.tsx
    - src/presentation/components/asset/hooks/index.ts
    - src/presentation/components/asset/index.ts
decisions:
  - "CsvExportService stub created with matching signature so AssetBulkActions compiles independently of parallel plan 03-04"
  - "Bulk delete uses sequential await loop rather than Promise.all to avoid concurrent SQLite write contention"
  - "Column visibility merges stored state with current COLUMNS defaults on load, so newly added columns get their default without wiping user preferences"
  - "Export trigger lives in AssetBulkActions menu (not toolbar) to keep it contextual to selection"
metrics:
  duration: 5min
  completed: 2026-02-03
---

# Phase 3 Plan 3: Configurable Columns and Bulk Selection Summary

Adds column visibility toggling with localStorage persistence, row-level and batch selection via checkboxes, and bulk delete/export actions to the asset list table.

## What Was Built

### useColumnVisibility Hook
Ten columns defined in a static COLUMNS config array: six visible by default (icon, tag, description, category, location, status) and four hidden (serialNumber, phone, owner, costCentre). State initialises from localStorage; on each toggle the entire visibility map is written back. A merge strategy on load ensures any columns added in future code updates receive their defaults without overwriting stored preferences.

### AssetBulkActions Component
A context-aware actions bar that appears above the table only when at least one row is selected. Contains a primary "Actions" dropdown menu with:
- Select All Visible (filtered count) / Select All (total count) / Clear Selection
- Export Selected -- invokes CsvExportService.exportAssets with a timestamped filename
- Delete Selected -- opens an MUI Dialog confirmation; on confirm, iterates selected IDs sequentially through AssetService.deleteAsset, clears selection, and triggers a parent data refresh

### AssetList Integration
- Header checkbox with indeterminate state wired to the sorted/filtered row set
- Per-row checkboxes with stopPropagation on the cell so clicking a checkbox does not open the detail drawer
- All ten data columns conditionally rendered in both header and body using isColumnVisible -- columns are absent from the DOM when hidden, not merely visually concealed
- A useEffect clears the selection array whenever debouncedSearch or the filters object reference changes
- selectedAssets for export is derived via useMemo over the full assets array filtered by selectedIds
- Dynamic colSpan for the empty-state row accounts for the checkbox column plus only the currently visible data columns

### AssetListToolbar Integration
- ViewColumn icon button opens a Menu listing all ten columns with individual Checkbox toggles
- Prop interface typed with ColumnKey for onToggleColumn to match the hook's discriminated union

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Parallel plan 03-04 injected unused imports into AssetListToolbar**

- **Found during:** Post-Task-3 compile verification
- **Issue:** An external editor (the concurrent 03-04 agent) added `DownloadIcon` import and an `onOpenExport` prop to AssetListToolbar that were never consumed in the component body. With `noUnusedLocals` and `noUnusedParameters` enabled in tsconfig, these would produce hard compile errors.
- **Fix:** Removed the stale import and prop. Export is fully handled by AssetBulkActions; the toolbar has no role in the export flow.
- **Files modified:** src/presentation/components/asset/AssetListToolbar.tsx
- **Commit:** 551edfc

**2. [Rule 3 - Blocking] CsvExportService did not yet exist (parallel plan 03-04)**

- **Found during:** Task 2 setup
- **Issue:** AssetBulkActions imports CsvExportService which is owned by the concurrently running plan 03-04. The file was absent.
- **Fix:** Created a minimal stub at src/application/services/CsvExportService.ts with the expected class shape and return type. Plan 03-04 will overwrite this stub with the full implementation.
- **Commit:** 06124d2

## Next Steps

- Plan 03-04 (CSV export service and dialog) delivers the full CsvExportService implementation that replaces the stub created here
- Phase verification will validate all Phase 3 success criteria end-to-end
