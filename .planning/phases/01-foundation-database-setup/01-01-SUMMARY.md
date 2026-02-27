---
phase: 01-foundation-database-setup
plan: 01
subsystem: data-model
tags: [spatial-entities, normalized-coordinates, repository, file-storage]
dependency_graph:
  requires: []
  provides: [RoomZone entity, Furniture entity, Infrastructure entity, FileStorageService, spatial repositories]
  affects: [schema, migrations]
tech_stack:
  added: [FileStorageService]
  patterns: [repository-pattern, normalized-coordinates, relative-paths]
key_files:
  created:
    - src/domain/entities/RoomZone.ts
    - src/domain/entities/Furniture.ts
    - src/domain/entities/Infrastructure.ts
    - src/infrastructure/services/FileStorageService.ts
    - src/infrastructure/repositories/interfaces/IRoomZoneRepository.ts
    - src/infrastructure/repositories/interfaces/IFurnitureRepository.ts
    - src/infrastructure/repositories/interfaces/IInfrastructureRepository.ts
    - src/infrastructure/repositories/sqlite/SqliteRoomZoneRepository.ts
    - src/infrastructure/repositories/sqlite/SqliteFurnitureRepository.ts
    - src/infrastructure/repositories/sqlite/SqliteInfrastructureRepository.ts
    - drizzle/migrations/0006_add_spatial_entities.sql
  modified:
    - src/domain/entities/index.ts
    - src/infrastructure/database/schema.ts
    - src/infrastructure/repositories/interfaces/index.ts
    - src/infrastructure/repositories/sqlite/index.ts
    - src/infrastructure/services/index.ts
    - drizzle/migrations/meta/_journal.json
decisions:
  - decision: "Used normalized coordinates (0.0-1.0) for all spatial entities"
    rationale: "Ensures coordinate system independence from image resolution, enables seamless zoom/pan without recalculation"
    outcome: "All spatial entities (RoomZone, Furniture, Infrastructure, Marker, Calibration) use consistent coordinate system"
  - decision: "Furniture and Infrastructure scoped to room zones via roomZoneId"
    rationale: "Hierarchical spatial containment matches physical reality and enables room-level filtering"
    outcome: "Clean foreign key relationships with cascade deletes when room zones removed"
  - decision: "JSON text columns for custom fields storage"
    rationale: "Simple schema, flexible field support without EAV complexity"
    outcome: "Repositories handle serialization/deserialization transparently"
  - decision: "FileStorageService uses database-relative paths"
    rationale: "Enables database portability across folders and devices without breaking image references"
    outcome: "Floor plan images can be moved with database file, cloud sync friendly"
metrics:
  duration_minutes: 45
  tasks_completed: 5
  files_created: 11
  files_modified: 6
  commits: 3
  completed_at: "2026-02-22"
---

# Phase 01 Plan 01: Spatial Entity Domain Models Summary

**One-liner:** Established foundational spatial entities (RoomZone, Furniture, Infrastructure) with normalized coordinates, repository pattern implementation, and file storage abstraction for portable database-relative paths.

## What Was Built

### Task 1: Verify Existing Spatial Entities Foundation
- Audited existing entities: Marker and Calibration
- Confirmed Marker uses normalizedX/normalizedY (0.0-1.0 range)
- Confirmed Calibration uses normalized point1X/Y and point2X/Y coordinates
- Verified all existing entities (Asset, FloorPlan, Location, Marker, Calibration) have repository interfaces with SQLite implementations
- Foundation validated as solid before adding new entities

**Commit:** Verification task (no commit)

### Task 2: Implement FileStorageService for Relative Path Handling
- Created `FileStorageService` to abstract file path handling for floor plan images
- Implemented `toRelativePath()`: converts absolute paths to database-relative paths
- Implemented `toAbsolutePath()`: resolves relative paths back to absolute for image loading
- Implemented `normalizePath()`: normalizes path separators (forward slashes for cross-platform)
- Uses Tauri path API for directory operations
- Addresses FOUND-04 requirement: database portability via relative paths

**Commit:** 9d5b89b

### Task 3: Create Spatial Entity Domain Models
- Created `RoomZone` entity with fields: id, floorPlanId, locationId, normalizedX/Y/Width/Height, color, name, timestamps
- Created `Furniture` entity with fields: id, floorPlanId, roomZoneId, type (desk/bench/custom), normalizedX/Y/Width/Height, rotation, customFields, timestamps
- Created `Infrastructure` entity with fields: id, floorPlanId, roomZoneId, type (power_outlet/network_port), normalizedX/Y, customFields, timestamps
- All entities use normalized coordinates (0.0-1.0 range) per FOUND-01
- Furniture and Infrastructure reference roomZoneId for spatial scoping
- Exported all entities from domain/entities/index.ts

**Commit:** 35e0d1e

### Task 4: Add Database Schema Tables for Spatial Entities
- Added `room_zones` table with normalized coordinate columns (real 0.0-1.0)
- Added `furniture` table with type enum, rotation field, and customFields JSON column
- Added `infrastructure` table with type enum and customFields JSON column
- Implemented foreign key relationships:
  - RoomZones → FloorPlans (cascade delete) and Locations (restrict delete)
  - Furniture → FloorPlans (cascade), RoomZones (cascade)
  - Infrastructure → FloorPlans (cascade), RoomZones (cascade)
- Created migration 0006_add_spatial_entities.sql
- All tables use real data type for normalized coordinates

**Commit:** 2cf0a7e

### Task 5: Implement Repository Interfaces and SQLite Implementations
- Created three repository interfaces:
  - `IRoomZoneRepository`: findById, findByFloorPlanId, findByLocationId, create, update, delete
  - `IFurnitureRepository`: findById, findByFloorPlanId, findByRoomZoneId, create, update, delete
  - `IInfrastructureRepository`: findById, findByFloorPlanId, findByRoomZoneId, create, update, delete
- Implemented SQLite repositories using Drizzle ORM following existing patterns
- JSON serialization/deserialization for customFields columns handled transparently
- Proper transaction handling for create/update/delete operations
- Foreign key constraints respected with cascade deletes
- All exports wired through index files

**Commit:** Included in 2cf0a7e (repositories created alongside schema)

## Deviations from Plan

None - plan executed as written with all tasks completed.

## Tech Notes

**Normalized Coordinates Pattern:**
All spatial entities use 0.0-1.0 coordinate system independent of image pixel dimensions. This enables:
- Resolution-independent placement
- Seamless zoom/pan without coordinate recalculation
- Clean data model for spatial queries

**Spatial Hierarchy:**
- RoomZones define boundaries on floor plans and link to Room locations
- Furniture and Infrastructure are scoped to RoomZones via roomZoneId
- Cascade deletes ensure referential integrity when floor plans or room zones removed

**File Storage Abstraction:**
FileStorageService enables database portability by storing image paths relative to database file location. Database + images folder can be moved together without breaking references.

**JSON Custom Fields:**
Furniture and Infrastructure support unlimited custom properties via JSON text columns, avoiding EAV table complexity while maintaining flexibility.

## Verification Results

1. ✅ npm run build completes successfully
2. ✅ Existing entities verified: Marker and Calibration use normalized coordinates (0.0-1.0)
3. ✅ All existing entities have repository interfaces with SQLite implementations
4. ✅ FileStorageService implements relative path conversion (toRelativePath, toAbsolutePath)
5. ✅ All three new entities (RoomZone, Furniture, Infrastructure) export from domain/entities/index.ts
6. ✅ Database schema contains roomZones, furniture, infrastructure tables with normalized coordinate columns
7. ✅ Migration file 0006_add_spatial_entities.sql generated in drizzle/migrations/
8. ✅ All six repository files (3 interfaces, 3 implementations) exist and export correctly
9. ✅ Repository implementations use Drizzle ORM and handle JSON custom fields

## Next Steps

- Phase 01 Plan 04: Add cloud folder detection and auto-migrations
- Phase 05: Room Zone Drawing - UI components to draw/edit room boundaries
- Phase 06: Asset Placement - UI components for drag-drop asset placement
- Phase 07: Furniture & Infrastructure Placement - UI for furniture/infrastructure placement

## Self-Check: PASSED

**Created files verified:**
- ✅ src/domain/entities/RoomZone.ts
- ✅ src/domain/entities/Furniture.ts
- ✅ src/domain/entities/Infrastructure.ts
- ✅ src/infrastructure/services/FileStorageService.ts
- ✅ src/infrastructure/repositories/interfaces/IRoomZoneRepository.ts
- ✅ src/infrastructure/repositories/interfaces/IFurnitureRepository.ts
- ✅ src/infrastructure/repositories/interfaces/IInfrastructureRepository.ts
- ✅ src/infrastructure/repositories/sqlite/SqliteRoomZoneRepository.ts
- ✅ src/infrastructure/repositories/sqlite/SqliteFurnitureRepository.ts
- ✅ src/infrastructure/repositories/sqlite/SqliteInfrastructureRepository.ts
- ✅ drizzle/migrations/0006_add_spatial_entities.sql

**Commits verified:**
- ✅ 9d5b89b (Task 2: FileStorageService)
- ✅ 35e0d1e (Task 3: Domain entities)
- ✅ 2cf0a7e (Task 4 & 5: Schema and repositories)

All files created and commits exist in repository.
