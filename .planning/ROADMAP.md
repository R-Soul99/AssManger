# Roadmap: Visual Asset Mapper

## Overview

This roadmap delivers a desktop application for visual asset management with interactive floor plan mapping. Starting with foundational architecture (normalized coordinates, repository abstraction), building core asset management, then adding spatial features (floor plan viewer, marker placement), and finally enabling real-world measurements through calibration. Each phase delivers verifiable capabilities that build toward the core value: making equipment location and details instantly accessible through spatial visualization.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Database Setup** - Establish architecture foundations and database infrastructure
- [x] **Phase 2: Location Hierarchy & Categories** - Build organizational structure and equipment classification
- [x] **Phase 3: Asset Management & CSV Export** - Implement core asset CRUD and data export
- [x] **Phase 4: Floor Plan Management** - Enable floor plan import and metadata management
- [x] **Phase 5: Floor Plan Viewer** - Build interactive viewer with pan/zoom and marker display
- [ ] **Phase 6: Marker Management** - Add spatial editing capabilities for equipment placement
- [ ] **Phase 7: Calibration & Measurement** - Enable real-world measurements with scale calibration

## Phase Details

### Phase 1: Foundation & Database Setup
**Goal**: Establish architectural foundations with normalized coordinates, repository abstraction, and database infrastructure that enables future scaling.

**Depends on**: Nothing (first phase)

**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, DB-01, DB-02, DB-03, DB-04, DB-05, DB-06

**Success Criteria** (what must be TRUE):
  1. Application can create new SQLite database file at user-chosen location
  2. Application can open existing database file and remember recent projects
  3. Application detects cloud-synced folders and warns user about SQLite corruption risks
  4. Domain entities (Asset, FloorPlan, Marker, Location, Calibration) are implemented with validation
  5. Normalized coordinate system (0.0-1.0 range) transforms correctly to pixel coordinates

**Plans**: 6 plans

Plans:
- [x] 01-01-PLAN.md — Tauri scaffolding, dependencies, and project structure
- [x] 01-02-PLAN.md — Domain entities with Zod validation
- [x] 01-03-PLAN.md — Database schema, connection, and migrations
- [x] 01-04-PLAN.md — Repository interfaces and SQLite implementations
- [x] 01-05-PLAN.md — Application services (coordinates, cloud detection, file storage)
- [x] 01-06-PLAN.md — Project management service and UI components

### Phase 2: Location Hierarchy & Categories
**Goal**: Users can organize assets by physical location hierarchy and classify equipment by category with visual styling.

**Depends on**: Phase 1

**Requirements**: LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, CAT-01, CAT-02, CAT-03

**Success Criteria** (what must be TRUE):
  1. User can create site, assign buildings to site, assign floors to building, assign rooms to floor
  2. User can edit and delete locations with system enforcing hierarchical integrity (no orphaned locations)
  3. User can create equipment categories with name, description, icon, and color
  4. User can edit and delete categories
  5. Location and category data persists correctly in database through repository layer

**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Implement Categories CRUD
- [x] 02-02-PLAN.md — Implement Locations as a flat list (CRUD)
- [x] 02-03-PLAN.md — Implement Location Hierarchy (parent/child relationships)
- [x] 02-04-PLAN.md — Link Assets to Categories and Locations

### Phase 3: Asset Management & CSV Export
**Goal**: Users can manage complete asset inventory with full CRUD operations, filtering, search, and Excel-compatible data export.

**Depends on**: Phase 2

**Requirements**: AST-01, AST-02, AST-03, AST-04, AST-05, AST-06, AST-07, AST-08, AST-09, AST-10, CSV-01, CSV-02, CSV-03, CSV-04, CSV-05

**Success Criteria** (what must be TRUE):
  1. User can create asset with required fields (asset tag, category, location, description)
  2. User can edit asset details (serial number, phone/extension, status, owner, cost centre, notes)
  3. User can view asset list with sortable columns and filter by site/building/floor/room, category, and status
  4. User can search assets by asset tag, description, serial number, or phone number
  5. User can view asset detail page showing all fields and linked floor plan markers
  6. User can export assets, locations, and categories to UTF-8 BOM CSV that opens correctly in Excel

**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Enhanced asset list with filtering, search, and sorting
- [x] 03-02-PLAN.md — Asset detail drawer with edit and dirty state tracking
- [x] 03-03-PLAN.md — Configurable columns and bulk selection
- [x] 03-04-PLAN.md — CSV export with UTF-8 BOM and Explorer reveal

### Phase 4: Floor Plan Management
**Goal**: Users can import floor plan images, organize them by building/floor, and manage floor plan metadata.

**Depends on**: Phase 2

**Requirements**: FLP-01, FLP-02, FLP-03, FLP-04, FLP-05, FLP-06

**Success Criteria** (what must be TRUE):
  1. User can import floor plan image (PNG/JPEG/BMP/TIF) and assign to building/floor
  2. User can view list of all floor plans organized by site/building/floor hierarchy
  3. User can edit floor plan metadata (name, building/floor assignment)
  4. User can delete floor plan with warning if markers exist
  5. System stores floor plan images with database-relative paths for portability
  6. System supports multiple floor plans per floor (different areas/zones)

**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Schema, service, and mock repository for floor plans
- [x] 04-02-PLAN.md — Import workflow with image conversion
- [x] 04-03-PLAN.md — Card list view with drag-to-reorder and detail view
- [x] 04-04-PLAN.md — Delete safety and bulk actions

### Phase 5: Floor Plan Viewer
**Goal**: Users can view floor plans with interactive pan/zoom, see all placed markers with category styling, and filter/toggle marker visibility.

**Depends on**: Phase 3, Phase 4

**Requirements**: VWR-01, VWR-02, VWR-03, VWR-04, VWR-05, VWR-06, VWR-07, VWR-08

**Success Criteria** (what must be TRUE):
  1. User can view floor plan with smooth pan (drag) and zoom (mouse wheel/pinch) controls
  2. User can see all asset markers displayed on floor plan with category-specific icons and colors
  3. User can click marker to see asset summary (name, asset tag, category, status)
  4. User can navigate from marker popup to full asset detail view
  5. User can toggle marker visibility by category
  6. User can filter markers by asset status with filtered markers highlighted on floor plan
  7. Viewer performs smoothly with 500+ markers through viewport culling

**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Canvas infrastructure and floor plan rendering
- [x] 05-02-PLAN.md — Pan/zoom controls integration
- [x] 05-03-PLAN.md — Marker rendering with category styling
- [x] 05-04-PLAN.md — Interactive marker popups and navigation
- [x] 05-05-PLAN.md — Filtering and visibility controls

### Phase 6: Marker Management
**Goal**: Users can place equipment markers on floor plans, link them to assets, reposition markers, and manage marker lifecycle.

**Depends on**: Phase 5

**Requirements**: MRK-01, MRK-02, MRK-03, MRK-04, MRK-05, MRK-06, MRK-07, MRK-08, MRK-09

**Success Criteria** (what must be TRUE):
  1. User can click on floor plan to place new marker
  2. User can link new marker to existing asset via search/dropdown
  3. User can create new asset directly from marker placement workflow
  4. User can drag marker to reposition it on floor plan
  5. User can delete marker from floor plan
  6. Marker coordinates stored as normalized values (0.0-1.0) and transformed to pixels during rendering
  7. Marker icons/colors automatically match linked asset's category
  8. User can see marker count per floor plan

**Plans**: 5 plans

Plans:
- [x] 06-01-PLAN.md — MarkerService mutations and useMarkers refresh trigger
- [x] 06-02-PLAN.md — Edit mode toggle button and filtered marker count in toolbar
- [x] 06-03-PLAN.md — Canvas edit interactions: click-to-place, drag-to-reposition, Space+drag pan
- [ ] 06-04-PLAN.md — AssetLinkDialog and QuickCreateAssetForm
- [ ] 06-05-PLAN.md — MarkerEditPopup and full FloorPlanViewer integration

### Phase 7: Calibration & Measurement
**Goal**: Users can calibrate floor plans to real-world scale and measure distances accurately using calibrated measurements.

**Depends on**: Phase 6

**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06, CAL-07, CAL-08, MSR-01, MSR-02, MSR-03, MSR-04, MSR-05, MSR-06

**Success Criteria** (what must be TRUE):
  1. User can activate two-point calibration tool and click two points representing known distance
  2. User can enter real-world distance and select units (metres/feet)
  3. System calculates and stores scale (units per pixel) with validation warnings for unrealistic values
  4. User can see calibration status and scale value displayed on floor plan
  5. User can re-calibrate floor plan at any time
  6. System shows visual feedback during calibration (line between points, distance preview)
  7. User can activate measurement tool on calibrated floor plan and measure distance between two points
  8. System displays real-world distance using calibration data with measurement line and label
  9. System warns if floor plan is not calibrated when measurement tool activated

**Plans**: TBD

Plans:
- [ ] TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Database Setup | 6/6 | Complete | 2026-01-29 |
| 2. Location Hierarchy & Categories | 4/4 | Complete | 2026-02-01 |
| 3. Asset Management & CSV Export | 4/4 | Complete | 2026-02-04 |
| 4. Floor Plan Management | 4/4 | Complete | 2026-02-07 |
| 5. Floor Plan Viewer | 5/5 | Complete | 2026-02-13 |
| 6. Marker Management | 1/5 | In Progress | - |
| 7. Calibration & Measurement | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-28*
*Last updated: 2026-02-19 (Phase 6 plan 06-03 complete — Canvas edit mode: click-to-place, drag-to-reposition, Space+drag pan)*
