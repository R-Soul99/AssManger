---
phase: 03-asset-management-csv-export
plan: 04
subsystem: csv-export
tags: [csv, export, tauri, opener, excel]
requires: ["03-01-PLAN.md"]
provides:
  - "CsvExportService with UTF-8 BOM and RFC 4180 field escaping"
  - "ExportDialog with filtered/all asset scope selection"
  - "Tauri opener plugin for revealing exported files in Explorer"
  - "Export methods for assets, locations, and categories"
affects: ["03-03-PLAN.md"]
tech-stack:
  added: ["@tauri-apps/plugin-opener", "tauri-plugin-opener"]
  patterns:
    - "UTF-8 BOM for Excel compatibility"
    - "CSV field escaping per RFC 4180"
    - "Save dialog with file reveal in OS explorer"
key-files:
  created:
    - src/application/services/CsvExportService.ts
    - src/presentation/components/asset/ExportDialog.tsx
  modified:
    - src/application/services/index.ts
    - src/presentation/components/asset/AssetList.tsx
    - src/presentation/components/asset/AssetListToolbar.tsx
    - src/presentation/components/asset/index.ts
    - src-tauri/Cargo.toml
    - src-tauri/src/lib.rs
    - src-tauri/capabilities/default.json
    - package.json
decisions:
  - decision: "Export all fields regardless of column visibility"
    rationale: "CSV export is a data transfer format. Users hide columns for display convenience but expect complete data in exports."
    impact: "CSV always contains all 14 asset fields even if table shows only 6 columns."
  - decision: "Reuse already-loaded categories/locations for location and category exports"
    rationale: "Reference data is already fetched on component mount. Re-fetching would be wasteful."
    impact: "Export reflects data as loaded at page mount -- refresh page if data changed externally."
metrics:
  duration: 8
  completed: 2026-02-03
---

# Phase 3 Plan 4: CSV Export Summary

Implemented full CSV export capability with Excel compatibility across assets, locations, and categories.

## What Was Built

### CsvExportService
- RFC 4180-compliant field escaping (handles commas, quotes, newlines)
- UTF-8 BOM prefix ensures Excel opens files with correct Unicode encoding
- Three export methods: exportAssets, exportLocations, exportCategories
- writeCSV core: assembles CSV string, opens Tauri save dialog, writes encoded file, reveals containing folder in OS explorer

### Tauri Opener Plugin
- Installed @tauri-apps/plugin-opener (npm) and tauri-plugin-opener (Cargo)
- Registered plugin in lib.rs builder chain
- Added opener:default capability permission

### ExportDialog
- Radio button scope selector: "Export Filtered" vs "Export All" with live asset counts
- Separate buttons for location and category exports
- Success/error feedback alert after each export attempt
- Shared exporting state disables all buttons during active write

### Integration
- Export button (Download icon) added to AssetListToolbar
- AssetList wires up export handlers using already-loaded reference data
- ExportDialog rendered alongside other asset management dialogs

## Commits

| Hash | Message |
| ---- | ------- |
| 26e0b3b | chore(03-04): install and configure Tauri opener plugin |
| 801ffee | feat(03-04): create CsvExportService with UTF-8 BOM and RFC 4180 escaping |
| e84878e | feat(03-04): integrate ExportDialog into AssetList |
| be49fd4 | feat(03-04): create ExportDialog and wire toolbar export button |

## Technical Highlights

### UTF-8 BOM Strategy
The BOM character (U+FEFF) is prepended as a JavaScript string before TextEncoder converts to bytes. This produces the correct EF BB BF byte sequence that Excel uses to detect UTF-8 encoding.

### Filtered vs All Export
"Filtered" exports sortedAssets (post-filter, post-sort pipeline). "All" exports the raw assets array (server-fetched, pre-filter). Both include all 14 fields regardless of which columns are visible in the table.

## Deviations from Plan

None -- plan executed exactly as written.

## Compilation Notes

`npx tsc --noEmit` reports zero errors in any file touched by plan 03-04. All reported errors are pre-existing in App.debug.tsx, ProjectService.ts, and SqliteAssetRepository.ts (null-vs-undefined mismatches on description fields and unused imports). These are outside the scope of this plan.

## Next Steps
- Phase 3 verification will validate all success criteria
- Bulk export from AssetBulkActions (plan 03-03) delegates to the same CsvExportService
