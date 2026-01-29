---
phase: 01-foundation-database-setup
plan: 03
subsystem: infrastructure-database
tags: [drizzle-orm, sqlite, schema, migrations, wal]

dependency-graph:
  requires: ["01-01-project-initialization"]
  provides: ["database-schema", "database-connection", "initial-migration"]
  affects: ["01-04-repository-implementations"]

tech-stack:
  added: []
  patterns: ["singleton-connection", "wal-mode", "normalized-coordinates"]

file-tracking:
  created:
    - "src/infrastructure/database/schema.ts"
    - "src/infrastructure/database/connection.ts"
    - "src/infrastructure/database/migrate.ts"
    - "drizzle/migrations/0000_sparkling_caretaker.sql"
    - "drizzle/migrations/meta/_journal.json"
    - "drizzle/migrations/meta/0000_snapshot.json"
  modified: []

decisions:
  - id: "db-normalized-coords"
    title: "Normalized coordinates as REAL type"
    rationale: "Store marker coordinates as 0.0-1.0 range using SQLite REAL type to prevent pixel coordinate lock-in"
  - id: "db-wal-mode"
    title: "WAL mode enabled by default"
    rationale: "Better concurrency and reduced corruption risk for SQLite in desktop app"
  - id: "db-cascade-deletes"
    title: "Cascade deletes for hierarchical data"
    rationale: "Floor plan deletion should cascade to markers and calibrations; location deletion cascades to children"

metrics:
  duration: "4 min"
  completed: "2026-01-29"
---

# Phase 01 Plan 03: Schema Design & Migration Setup Summary

**One-liner:** Complete Drizzle ORM schema with 5 domain tables, WAL-enabled connection factory, and initial migration using normalized coordinates for spatial data.

## What Was Built

### Database Schema (schema.ts)
Created comprehensive Drizzle ORM schema defining all 5 domain tables:

1. **locations** - Hierarchical location model (site → building → floor → room)
   - Self-referencing foreign key for parent-child relationships
   - Cascade deletes for hierarchy cleanup

2. **assets** - Asset registry with organizational metadata
   - Unique constraint on tag field
   - Restrict delete when referenced by locations
   - Optional financial fields (cost, purchase date)

3. **floor_plans** - Floor plan images with dimensions
   - References location via foreign key
   - Stores image path, width, height
   - Cascade delete with location

4. **markers** - Spatial markers linking assets to floor plans
   - **Normalized coordinates (0.0-1.0) as REAL type** - Critical for viewport independence
   - Cascade deletes with both floor plan and asset
   - Enables spatial queries in future phases

5. **calibrations** - Two-point calibration data for measurements
   - Stores calibration points as normalized coordinates
   - Real-world distance and units (metres/feet)
   - Pre-calculated scale factor
   - One calibration per floor plan

### Database Connection Factory (connection.ts)
Singleton connection manager with:
- WAL mode enabled for better concurrency
- Foreign key enforcement enabled
- Connection reuse for same database path
- Transaction wrapper with automatic rollback
- Connection state tracking

### Migration Infrastructure
- Initial migration generated via Drizzle Kit
- Migration runner utility for programmatic execution
- Metadata journal for migration tracking

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create Drizzle schema definitions | fce7b43 | schema.ts |
| 2 | Create database connection factory | 225acbd | connection.ts |
| 3 | Generate initial database migration | 8af4823 | migrations/*.sql, migrate.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed self-referencing foreign key type error**
- **Found during:** Task 1 - TypeScript compilation
- **Issue:** `locations` table self-reference caused circular type inference error in strict TypeScript
- **Fix:** Added explicit `any` type annotation to arrow function in `parentId` reference
- **Files modified:** `src/infrastructure/database/schema.ts`
- **Commit:** fce7b43 (included in Task 1)

No other deviations - plan executed as written.

## Key Decisions Made

### 1. Normalized Coordinates as Core Pattern
Storing all spatial coordinates (markers, calibrations) in 0.0-1.0 normalized range instead of pixel coordinates.

**Why:** Prevents viewport lock-in. Floor plan images can be rescaled without updating marker positions. Future phases can render at any resolution.

**Impact:** Repository implementations must convert between normalized and pixel coordinates at boundaries.

### 2. WAL Mode by Default
Enabled Write-Ahead Logging mode for all database connections.

**Why:** Better concurrency (readers don't block writers), reduced corruption risk, better performance for desktop apps.

**Trade-off:** Slightly more complex file structure (database + WAL + SHM files). Acceptable for desktop app use case.

### 3. Cascade Delete Strategy
Hierarchical cascade deletes for:
- Location hierarchy (parent deletion cascades to children)
- Floor plans → markers (floor plan deletion removes all markers)
- Floor plans → calibrations (floor plan deletion removes calibration)
- Assets → markers (asset deletion removes visual representations)

**Why:** Maintains referential integrity without orphaned records. Matches user mental model (deleting floor plan should remove all markers on it).

**Trade-off:** Could lose data if user accidentally deletes parent. Future phases should implement soft deletes or confirmation dialogs.

## Verification Results

All verification criteria passed:

✓ Schema exports all 5 tables: locations, assets, floorPlans, markers, calibrations
✓ Connection factory exports: initializeDatabase, getDatabase, closeDatabase, withTransaction
✓ Migration contains CREATE TABLE for all 5 tables
✓ Normalized coordinates use REAL type (not INTEGER)
✓ Foreign key constraints present with correct cascade/restrict behavior
✓ WAL mode pragma in connection factory
✓ TypeScript compilation successful

## Next Phase Readiness

### Enables

**Plan 01-04 - Repository Implementations:**
- Schema provides table definitions for repository queries
- Connection factory provides database access
- Migration ready to create tables on first run

**Phase 2 - Location & Asset Management:**
- Domain entity structure defined in schema
- Hierarchical location queries supported via self-reference
- Asset lookup by tag via unique index

**Phase 5 - Floor Plan Viewer:**
- Normalized coordinate system enables resolution-independent rendering
- Spatial data ready for canvas drawing

### Blockers/Concerns

None. Database infrastructure complete and ready for repository layer.

### Technical Debt

1. **TypeScript type errors in node_modules:** Drizzle ORM package has some type definition issues with current TypeScript version. Doesn't affect runtime but creates noise in IDE. Can be suppressed with `skipLibCheck: true` (already enabled).

2. **No migration rollback strategy:** Only forward migrations supported. Future phases should implement down migrations for development flexibility.

3. **Hard-coded migration path:** Migration runner uses relative path `./drizzle/migrations`. Should be configurable or derived from drizzle.config.ts.

## Files Modified

### Created
- `src/infrastructure/database/schema.ts` (122 lines)
- `src/infrastructure/database/connection.ts` (95 lines)
- `src/infrastructure/database/migrate.ts` (11 lines)
- `drizzle/migrations/0000_sparkling_caretaker.sql` (70 lines)
- `drizzle/migrations/meta/_journal.json`
- `drizzle/migrations/meta/0000_snapshot.json`

### Modified
None - all new files.

## Testing Notes

**Recommended tests for next plan:**
1. Connection factory: Test singleton behavior, WAL mode verification
2. Schema integrity: Test foreign key constraints, cascade deletes
3. Migration runner: Test migration application, idempotency
4. Normalized coordinates: Test 0.0-1.0 range validation

**Current state:** No tests written (infrastructure layer, will be tested via repository integration tests).

## Lessons Learned

1. **Self-referencing foreign keys need type annotations:** TypeScript can't infer circular references without help. Use explicit `any` type for arrow functions.

2. **Drizzle Kit generates clean migrations:** Automatic migration generation worked perfectly on first try. No manual SQL writing needed.

3. **WAL mode is simple to enable:** Single pragma call, significant benefits for desktop SQLite usage.

## Related Documentation

- Drizzle ORM docs: https://orm.drizzle.team/docs/overview
- SQLite WAL mode: https://www.sqlite.org/wal.html
- Plan 01-01: Project initialization (base setup)
- Plan 01-02: Domain entities (schema matches domain models)
- Next: Plan 01-04: Repository implementations (will use this schema)
