---
phase: 03-asset-management-csv-export
plan: 01
subsystem: asset-management
tags: [assets, filtering, search, sorting, ui]
requires: [02-04-PLAN.md]
provides:
  - "Advanced asset filtering by category, status, and location hierarchy"
  - "Debounced text search for assets"
  - "Sortable asset list columns"
affects: [03-02-PLAN.md, 03-04-PLAN.md]
tech-stack:
  added: []
  patterns:
    - "Hybrid filtering (Server-side search + Client-side hierarchy)"
    - "Custom hooks for UI logic (useAssetFilters, useAssetSort)"
    - "Debounced input pattern"
key-files:
  created:
    - src/presentation/components/asset/hooks/useAssetFilters.ts
    - src/presentation/components/asset/hooks/useAssetSort.ts
    - src/presentation/components/asset/hooks/useDebounce.ts
    - src/presentation/components/asset/hooks/index.ts
    - src/presentation/components/asset/AssetListToolbar.tsx
  modified:
    - src/presentation/components/asset/AssetList.tsx
    - src/application/services/AssetService.ts
decisions:
  - decision: "Hybrid filtering strategy"
    rationale: "DB handles text search efficiently; Client handles complex hierarchical location filtering to avoid complex recursive SQL queries."
    impact: "Fast search, flexible hierarchy filtering, but requires loading all matching assets for client-side filtering (acceptable for expected dataset size)."
  - decision: "Debounce search input by 300ms"
    rationale: "Prevents excessive database queries on every keystroke."
    impact: "Better performance and smoother UI."
  - decision: "Cascading location dropdowns"
    rationale: "Guides user through hierarchy (Site -> Building -> Floor -> Room) rather than a flat list."
    impact: "Intuitive filtering for nested location structures."
metrics:
  duration: 15min
  completed: 2026-02-03
---

# Phase 3 Plan 1: Asset List Filtering & Sorting Summary

Implemented comprehensive filtering, sorting, and search capabilities for the asset list.

## What Was Built

### Custom Hooks
- `useDebounce`: Generic hook for delaying search input effects.
- `useAssetFilters`: Manages filter state and implements hierarchical location filtering logic (tracing asset location up to matched filter).
- `useAssetSort`: Handles multi-column sorting with direction toggling and null handling.

### UI Components
- **AssetListToolbar**: A responsive toolbar containing:
  - Text search with icon
  - Category and Status dropdowns
  - Cascading Location dropdowns (Site > Building > Floor > Room) that enable/disable based on parent selection
  - Clear filters button and result count

### Integration
- Updated `AssetService` to pass search terms to the repository.
- Refactored `AssetList` to:
  - Load reference data (categories, locations) on mount.
  - Perform server-side text search (via repository LIKE queries).
  - Apply client-side filtering for exact matches (Category, Status) and hierarchical logic (Location).
  - Apply client-side sorting.
  - Display sortable column headers with visual indicators.

## Technical Highlights

### Hierarchical Location Filtering
Instead of complex recursive SQL, we filter client-side by traversing *up* the tree:
```typescript
// useAssetFilters.ts
const targetLocationId = filters.floorId || filters.buildingId || filters.siteId;
if (targetLocationId) {
  // Trace up from asset's location to see if it belongs to selected parent
  let current = location;
  while (current) {
    if (current.id === targetLocationId) return true;
    current = locations.find(l => l.id === current.parentId);
  }
  return false;
}
```

### Hybrid Data Pipeline
1. **Search**: `searchTerm` -> Repository (SQL `LIKE`) -> Reduced dataset
2. **Filter**: `filters` -> Client (Array `.filter`) -> Matched dataset
3. **Sort**: `sortState` -> Client (Array `.sort`) -> Ordered dataset

## Next Steps
- Implement **Asset Detail Drawer** (Plan 03-02) to allow editing the filtered assets.
- Add CSV Export (Plan 03-04) using the filtered dataset.
