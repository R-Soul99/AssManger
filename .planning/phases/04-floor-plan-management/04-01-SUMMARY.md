---
phase: 04-floor-plan-management
plan: 01
subsystem: infrastructure-floorplan
tags: [drizzle-orm, sqlite, nullable-locationId, display-order, mock-repository, service-layer]

dependency-graph:
  requires: ["03-complete", "schema", "IFloorPlanRepository"]
  provides: ["FloorPlanService", "MockFloorPlanRepository", "migration-0004", "nullable-locationId"]
  affects: ["04-02-import-workflow", "04-03-card-list"]

tech-stack:
  added: []
  patterns: ["constructor-injected-service", "ServiceResult", "mock-fallback-factory", "drizzle-table-recreation"]

file-tracking:
  created:
    - "src/infrastructure/repositories/mock/MockFloorPlanRepository.ts"
    - "src/application/services/FloorPlanService.ts"
    - "drizzle/migrations/0004_next_cerise.sql"
  modified:
    - "src/infrastructure/database/schema.ts"
    - "src/domain/validators/schemas.ts"
    - "src/domain/entities/FloorPlan.ts"
    - "src/infrastructure/repositories/interfaces/IFloorPlanRepository.ts"
    - "src/infrastructure/repositories/sqlite/SqliteFloorPlanRepository.ts"
    - "src/infrastructure/repositories/RepositoryFactory.ts"
    - "src/infrastructure/repositories/mock/index.ts"
    - "src/application/services/index.ts"

decisions:
  - id: "fp-nullable-locationId"
    title: "locationId nullable at import time"
    rationale: "CONTEXT decision: location assigned after import. FK uses ON DELETE SET NULL."
  - id: "fp-display-order"
    title: "display_order INTEGER DEFAULT 0 for reorder persistence"
    rationale: "Supports drag-to-reorder in card list view. Sequential update in reorder() method."
  - id: "fp-service-result-reuse"
    title: "Import ServiceResult type from AssetService"
    rationale: "ServiceResult already exported from AssetService; avoids redefinition."

metrics:
  completed: "2026-02-04"
---

# Phase 04 Plan 01: Schema + Service + Mock Summary

**One-liner:** Extended FloorPlan infrastructure for nullable locationId and displayOrder, created FloorPlanService and MockFloorPlanRepository, generated migration 0004.

## What Was Built

### Schema Changes (Task 1)
- `schema.ts`: `locationId` made nullable with `ON DELETE SET NULL`; added `displayOrder INTEGER DEFAULT 0`
- `schemas.ts`: FloorPlanSchema updated to `locationId: z.string().uuid().nullable()` and `displayOrder: z.number().int().default(0)`
- `FloorPlan.ts`: Entity getters updated for nullable locationId and displayOrder

### Repository Updates (Task 2)
- `IFloorPlanRepository`: Added `reorder(locationId, orderedIds)` and `findUnassigned()` methods
- `SqliteFloorPlanRepository`: Implemented both methods; `findByLocation()` now orders by `display_order ASC, created_at ASC`; `save()` includes displayOrder; `toEntity()` maps displayOrder

### MockFloorPlanRepository (Task 3)
- 3 seed records: Ground Floor Plan (assigned), First Floor Plan (assigned), Unassigned Import (locationId: null)
- Implements all IFloorPlanRepository methods against static store
- `hasMarkers()` / `getMarkerCount()` return false/0 (no markers in mock)
- RepositoryFactory falls back to mock when `db` is null (same pattern as Location/Asset/Category)
- Fixed stray duplicate `return` + `}` in RepositoryFactory that executor left behind

### FloorPlanService (Task 4)
- `importFloorPlan`: Creates FloorPlan with uuidv4, defaults name to 'Untitled Floor Plan', locationId to null
- `updateFloorPlan`: Finds existing, applies partial update with updatedAt
- `deleteFloorPlan`: Returns `{ hadMarkers }` flag for confirmation dialogs in later plans
- `getFloorPlanById`, `getAllFloorPlans`, `getUnassignedFloorPlans`: Read operations
- `reorderFloorPlans`: Delegates to repo.reorder()
- `getMarkerCount`, `hasMarkers`: Delegates to repo
- All methods return ServiceResult (imported from AssetService, not redefined)

### Migration 0004 (Task 5)
- File: `drizzle/migrations/0004_next_cerise.sql`
- Table-recreation pattern (Drizzle SQLite strategy): new table → insert → drop old → rename
- `location_id TEXT` (nullable, no NOT NULL)
- `display_order INTEGER DEFAULT 0 NOT NULL`
- `FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL`

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Update schema, Zod, entity for nullable locationId + displayOrder | 3418bd9 |
| 2 | Update IFloorPlanRepository + SqliteFloorPlanRepository | 77e5dd4 |
| 3 | Create MockFloorPlanRepository + wire RepositoryFactory | 14d8ae7 |
| 4+5 | Create FloorPlanService + generate migration 0004 | c4c53bb |

## Deviations from Plan

### Auto-fixed Issues

**1. Duplicate return/brace in RepositoryFactory.ts**
- Executor left stray lines 78-79 (`return this.floorPlanRepo; }`) after the completed `getFloorPlanRepository()` method when it was interrupted mid-task-3
- Removed before committing task 3

**2. ServiceResult not redefined in FloorPlanService**
- Plan specified defining a local `ServiceResult` type in FloorPlanService
- AssetService already exports `ServiceResult` — imported instead to avoid duplication

No other deviations.

## Verification Results

- TypeScript compilation: No new errors introduced (pre-existing errors in App.debug.tsx, ProjectService, SqliteAssetRepository are unrelated)
- Migration 0004 generated with correct nullable location_id and display_order column
- FloorPlanService exports ImportFloorPlanDto, UpdateFloorPlanDto from services/index.ts
- MockFloorPlanRepository returns 3 floor plans including one with null locationId
- RepositoryFactory.getFloorPlanRepository() returns mock when db is null

## Next Phase Readiness

### Enables
- **04-02 (Import Workflow):** FloorPlanService.importFloorPlan() ready; mock repo provides fallback
- **04-03 (Card List):** findAll(), findByLocation(), findUnassigned(), reorder() all available; displayOrder persisted
- **04-04 (Delete Safety):** deleteFloorPlan() returns hadMarkers flag for confirmation dialogs

### Blockers/Concerns
None. All 04-01 success criteria met.
