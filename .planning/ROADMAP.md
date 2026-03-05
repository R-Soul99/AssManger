# Roadmap: Visual Asset Mapper - Spatial Planning Interface

## Overview

This roadmap transforms requirements into a spatial planning tool that lets users visually define rooms on floor plans, drag-place assets and furniture, and manage infrastructure with real-world measurements. Starting with foundational architecture (normalized coordinates, repository pattern), building asset/location management and spatial UI shell, then layering floor plan management, room zone drawing, asset/furniture/infrastructure placement, and finally measurement capabilities. Each phase delivers observable user value while respecting technical dependencies.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Data Model** - Establish normalized coordinates, repository pattern, and database architecture
- [ ] **Phase 2: Asset & Location Management** - CRUD operations for assets, hierarchical locations, and CSV export
- [ ] **Phase 3: Spatial UI Shell & Navigation** - Three-panel layout with location tree, canvas area, and pan/zoom controls
- [ ] **Phase 4: Floor Plan Management** - Import, display, and navigate floor plan images
- [ ] **Phase 5: Room Zone Drawing** - Draw and manage colored room boundaries on floor plans
- [ ] **Phase 6: Asset Placement** - Drag-and-drop asset icons onto canvas with linking
- [ ] **Phase 7: Furniture & Infrastructure Placement** - Resizable furniture rectangles and infrastructure icons
- [ ] **Phase 8: Measurement & Calibration** - Two-point calibration and distance measurement tools

## Phase Details

### Phase 1: Foundation & Data Model
**Goal**: Establish architectural foundation with normalized coordinates, repository abstraction, and database schema that enables all spatial features without future migration pain.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08, FOUND-09, FOUND-10
**Success Criteria** (what must be TRUE):
  1. All spatial data stored using normalized coordinates (0.0-1.0 range)
  2. Repository interfaces defined with SQLite implementations working
  3. Domain entities with validation (Asset, FloorPlan, RoomZone, Furniture, Infrastructure, Location, Calibration) exist
  4. User can create new database or open existing database file
  5. Database migrations execute successfully on schema changes
  6. File storage abstraction uses relative paths not absolute paths
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Complete spatial entity domain models (RoomZone, Furniture, Infrastructure)
- [x] 01-02-PLAN.md — Implement asset types and custom fields system
- [x] 01-03-PLAN.md — Build project management workflows (create/open/recent databases)
- [ ] 01-04-PLAN.md — Add cloud folder detection and auto-migrations

### Phase 2: Asset & Location Management
**Goal**: Deliver core non-spatial asset management features (CRUD, search, filter, hierarchy) and CSV export, validating repository layer before adding spatial complexity.
**Depends on**: Phase 1
**Requirements**: ASSET-01, ASSET-02, ASSET-03, ASSET-04, ASSET-05, ASSET-06, ASSET-07, ASSET-08, LOC-01, LOC-02, LOC-03, LOC-04, LOC-05, LOC-06, EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05, EXPORT-06, EXPORT-07
**Success Criteria** (what must be TRUE):
  1. User can create, view, update, and delete assets with required fields (tag, description, asset type, location)
  2. User can search assets by tag, description, type, or location
  3. User can filter assets by asset type, location, or status
  4. User can create and navigate Building → Floor → Room hierarchy in left sidebar tree
  5. User can edit and delete locations with cascade warnings if assets/floor plans linked
  6. User can export assets, locations, and asset types to Excel-compatible CSV files
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Location hierarchy management with tree UI and cascade delete warnings
- [ ] 02-02-PLAN.md — Asset CRUD with standalone list page (search, filter, create, edit, delete)
- [ ] 02-03-PLAN.md — CSV export service with UTF-8 BOM for Excel compatibility

### Phase 3: Spatial UI Shell & Navigation
**Goal**: Build three-panel layout foundation and pan/zoom navigation system that all spatial features will use, establishing responsive canvas interaction patterns.
**Depends on**: Phase 2
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07
**Success Criteria** (what must be TRUE):
  1. Three-panel layout displays correctly with location tree (left), canvas (center), details panel (right)
  2. Bottom toolbar shows Edit/Move/Delete tools plus asset/furniture/infrastructure palette icons
  3. Details panel shows context-sensitive information (asset counts by type when room selected)
  4. User can pan canvas by dragging background and zoom using scroll wheel or zoom controls
  5. Zoom preserves cursor position and respects limits (10%-500%)
  6. Layout adapts to window resize with minimum 1280x720 support
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 4: Floor Plan Management
**Goal**: Enable floor plan image import and display on canvas, validating coordinate transformation and file storage before adding interactive editing.
**Depends on**: Phase 3
**Requirements**: FLOOR-01, FLOOR-02, FLOOR-03, FLOOR-04, FLOOR-05, FLOOR-06, FLOOR-07, FLOOR-08
**Success Criteria** (what must be TRUE):
  1. User can import floor plan images (PNG, JPG, TIFF) and link to Building or Floor locations
  2. Floor plan displays on canvas when location selected in tree
  3. Floor plan maintains correct aspect ratio across all zoom levels
  4. Floor plan images stored with relative paths in database for portability
  5. Multiple floor plans work correctly (one per Building/Floor level)
  6. User can pan and zoom floor plan smoothly without lag
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 5: Room Zone Drawing
**Goal**: Enable users to draw colored room boundaries on floor plans and zoom into specific rooms, establishing spatial scoping for all objects.
**Depends on**: Phase 4
**Requirements**: ROOM-01, ROOM-02, ROOM-03, ROOM-04, ROOM-05, ROOM-06, ROOM-07, ROOM-08, ROOM-09
**Success Criteria** (what must be TRUE):
  1. User can draw room boundaries as colored rectangles on floor plans
  2. Room zones link correctly to Room locations in hierarchy
  3. Room zones display with color coding (yellow, cyan, magenta, orange per mockup)
  4. User can resize room zones by dragging corner/edge handles
  5. User can move room zones by dragging interior
  6. User can click room in tree and canvas zooms to show only that room's bounds
  7. Room zones stored with normalized coordinates (x, y, width, height, color)
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 6: Asset Placement
**Goal**: Deliver core spatial value proposition - drag-and-drop asset placement on floor plans with visual icons and linking to asset records.
**Depends on**: Phase 5
**Requirements**: PLACE-01, PLACE-02, PLACE-03, PLACE-04, PLACE-05, PLACE-06, PLACE-07, PLACE-08, PLACE-09, PLACE-10, PLACE-11
**Success Criteria** (what must be TRUE):
  1. User can drag asset icon from toolbar palette and drop on canvas to place
  2. User can click "Add..." button in details panel and asset icon follows cursor until clicked to place
  3. User can link placed marker to existing asset via dialog/autocomplete
  4. User can create new asset inline during placement workflow
  5. Asset markers display with category-specific icons on canvas
  6. User can click asset marker to view/edit details in right panel
  7. User can drag asset marker to reposition on floor plan
  8. Asset placements scope correctly to room zones (only visible when room displayed)
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 7: Furniture & Infrastructure Placement
**Goal**: Complete spatial object palette with resizable furniture rectangles and infrastructure point placements, enabling full facility visualization.
**Depends on**: Phase 6
**Requirements**: FURN-01, FURN-02, FURN-03, FURN-04, FURN-05, FURN-06, FURN-07, FURN-08, FURN-09, FURN-10, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07
**Success Criteria** (what must be TRUE):
  1. User can drag furniture types (Desk, Bench, Custom) from toolbar onto canvas
  2. Furniture displays as resizable rectangles with outlined shapes
  3. User can resize furniture by dragging corner/edge handles
  4. User can rotate furniture pieces via rotation handle or property input
  5. User can move furniture by dragging interior
  6. User can drag infrastructure icons (Power outlet, Network port) from toolbar to canvas
  7. Furniture and infrastructure scope correctly to room zones (only visible when room displayed)
  8. Visual distinction is clear between assets (icons), furniture (outlined rectangles), and infrastructure (distinct icon style)
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 8: Measurement & Calibration
**Goal**: Enable accurate real-world measurements through two-point calibration and distance measurement tool, completing spatial planning feature set.
**Depends on**: Phase 7
**Requirements**: MEAS-01, MEAS-02, MEAS-03, MEAS-04, MEAS-05, MEAS-06, MEAS-07, MEAS-08, MEAS-09, MEAS-10
**Success Criteria** (what must be TRUE):
  1. User can calibrate floor plan scale using two-point calibration workflow
  2. User clicks two points and enters known real-world distance
  3. Calibration validates input with minimum distance checks and sanity validation for unrealistic scales
  4. Visual feedback shown during calibration with real-time calculation preview
  5. User can access measure tool from toolbar
  6. Measure tool displays real-world distance between two points clicked
  7. Coordinate display shown when using measure tool (hover near crosshairs)
  8. Coordinates hidden from main UI (background data only, not prominent display)
**Plans**: TBD

Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 3/4 | In progress | - |
| 2. Asset & Location Management | 0/3 | Not started | - |
| 3. Spatial UI Shell & Navigation | 0/TBD | Not started | - |
| 4. Floor Plan Management | 0/TBD | Not started | - |
| 5. Room Zone Drawing | 0/TBD | Not started | - |
| 6. Asset Placement | 0/TBD | Not started | - |
| 7. Furniture & Infrastructure Placement | 0/TBD | Not started | - |
| 8. Measurement & Calibration | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-21*
*Last updated: 2026-03-05 (Phase 2 plans finalized)*
*Reflects spatial UI pivot from PROJECT.md vision (three-panel layout, room zones, furniture, infrastructure)*
