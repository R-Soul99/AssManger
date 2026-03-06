# Requirements

**Project:** Visual Asset Mapper - Spatial Planning Interface
**Version:** v1 (Milestone 1 - Spatial UI Pivot)
**Last Updated:** 2026-02-21

## Core Value

Visual spatial planning interface that lets users define rooms on floor plans, drag-place assets and furniture, and manage infrastructure with real-world measurements.

## v1 Requirements

### Foundation & Data Model (FOUND)

- [ ] **FOUND-01**: System uses normalized coordinates (0.0-1.0) for all spatial data storage
- [ ] **FOUND-02**: Repository pattern abstracts database access (SQLite → PostgreSQL migration path)
- [x] **FOUND-03**: Domain entities with validation (Asset, FloorPlan, RoomZone, Furniture, Infrastructure, Location, Calibration)
- [ ] **FOUND-04**: File storage abstraction for floor plan images (relative paths, not absolute)
- [ ] **FOUND-05**: Database migrations system for schema evolution
- [x] **FOUND-06**: Single-file SQLite database with configurable storage path
- [ ] **FOUND-07**: Database file path configurability (avoid cloud-synced folders by default)
- [x] **FOUND-08**: "Open database" workflow (select existing .db file)
- [x] **FOUND-09**: "Create new database" workflow (initialize new .db with schema)
- [x] **FOUND-10**: Recent projects tracking (remember last 5 opened databases)

### Asset Management (ASSET)

- [x] **ASSET-01**: User can create assets with required fields (tag, description, asset type, location)
- [x] **ASSET-02**: User can view asset list with search and filter capabilities
- [x] **ASSET-03**: User can update asset details (tag, description, type, location, custom fields)
- [x] **ASSET-04**: User can delete assets with confirmation
- [ ] **ASSET-05**: Asset types defined: PC, Phone, Printer, Monitor, Electronics, Custom Machinery
- [x] **ASSET-06**: User can search assets by tag, description, type, or location
- [x] **ASSET-07**: User can filter assets by asset type, location, or status
- [x] **ASSET-08**: Asset detail view shows all metadata and linked spatial placement

### Hierarchical Locations (LOC)

- [x] **LOC-01**: User can create location hierarchy (Building → Floor → Room structure)
- [x] **LOC-02**: User can view location tree in left sidebar
- [x] **LOC-03**: User can navigate tree to select Building or Floor for floor plan display
- [x] **LOC-04**: User can edit location names and hierarchy relationships
- [x] **LOC-05**: User can delete locations (with cascade warning if assets/floor plans linked)
- [x] **LOC-06**: Locations persist building/floor/room relationships in database

### Spatial UI Shell (UI)

- [x] **UI-01**: Three-panel layout (location tree left, canvas center, details panel right)
- [ ] **UI-02**: Location tree displays Building → Floor → Room hierarchy
- [ ] **UI-03**: Canvas area displays selected floor plan with pan/zoom controls
- [ ] **UI-04**: Details panel shows context-sensitive information (asset counts by type when room selected)
- [ ] **UI-05**: Bottom toolbar with Edit/Move/Delete tools
- [ ] **UI-06**: Asset type palette in toolbar (PC, Phone, Printer, Monitor, Electronics, Machinery icons)
- [ ] **UI-07**: Furniture palette in toolbar (Desk, Bench, Custom)
- [ ] **UI-08**: Infrastructure palette in toolbar (Power outlet, Network port)
- [x] **UI-09**: Responsive layout adapts to window resize (minimum 1280x720)

### Floor Plan Management (FLOOR)

- [ ] **FLOOR-01**: User can import floor plan image (PNG, JPG, TIFF formats)
- [ ] **FLOOR-02**: User can link floor plan to location (Building or Floor level)
- [ ] **FLOOR-03**: User can view floor plan on canvas when location selected in tree
- [ ] **FLOOR-04**: User can pan floor plan by dragging canvas
- [ ] **FLOOR-05**: User can zoom floor plan using scroll wheel or zoom controls
- [ ] **FLOOR-06**: Floor plan images stored with relative paths in database
- [ ] **FLOOR-07**: Multiple floor plans supported per project (one per Building/Floor)
- [ ] **FLOOR-08**: Floor plan image displayed at correct aspect ratio

### Room Zone Management (ROOM)

- [ ] **ROOM-01**: User can draw room boundaries as colored rectangles on floor plan
- [ ] **ROOM-02**: User can link room zone to Room location in hierarchy
- [ ] **ROOM-03**: Room zones displayed with color coding (yellow, cyan, magenta, orange)
- [ ] **ROOM-04**: User can resize room zone by dragging corner/edge handles
- [ ] **ROOM-05**: User can move room zone by dragging interior
- [ ] **ROOM-06**: User can delete room zone with confirmation
- [ ] **ROOM-07**: User can click room in tree → canvas zooms to show only that room's bounds
- [ ] **ROOM-08**: Room zones stored with normalized coordinates (x, y, width, height, color)
- [ ] **ROOM-09**: Visual color picker for room zone color assignment

### Asset Placement (PLACE)

- [ ] **PLACE-01**: User can drag asset icon from toolbar palette onto canvas to place
- [ ] **PLACE-02**: User can click "Add..." button in details panel → asset icon follows cursor → click to place
- [ ] **PLACE-03**: User can link placed marker to existing asset via dialog/autocomplete
- [ ] **PLACE-04**: User can create new asset inline during placement workflow
- [ ] **PLACE-05**: Asset markers displayed as category-specific icons on canvas
- [ ] **PLACE-06**: User can click asset marker to view/edit details in right panel
- [ ] **PLACE-07**: User can drag asset marker to reposition on floor plan
- [ ] **PLACE-08**: User can delete asset marker with confirmation
- [ ] **PLACE-09**: Asset placements scoped to room zones (only visible when room displayed)
- [ ] **PLACE-10**: Asset placements stored with normalized coordinates (x, y) and asset link
- [ ] **PLACE-11**: Visual distinction between asset types via icon library

### Furniture Placement (FURN)

- [ ] **FURN-01**: User can drag furniture type from toolbar onto canvas to place
- [ ] **FURN-02**: Furniture displayed as resizable rectangles with outlined shapes
- [ ] **FURN-03**: User can resize furniture by dragging corner/edge handles
- [ ] **FURN-04**: User can rotate furniture pieces via rotation handle or property input
- [ ] **FURN-05**: User can move furniture by dragging interior
- [ ] **FURN-06**: User can delete furniture with confirmation
- [ ] **FURN-07**: Furniture types defined: Desk, Bench, Custom
- [ ] **FURN-08**: Furniture stored with normalized coordinates (x, y, width, height, rotation)
- [ ] **FURN-09**: Furniture scoped to room zones (only visible when room displayed)
- [ ] **FURN-10**: Visual distinction from assets (outlined rectangles vs icons)

### Infrastructure Placement (INFRA)

- [ ] **INFRA-01**: User can drag infrastructure icon from toolbar onto canvas to place
- [ ] **INFRA-02**: Infrastructure types defined: Power outlet, Network port
- [ ] **INFRA-03**: Infrastructure displayed as distinct icons (different style from assets)
- [ ] **INFRA-04**: User can move infrastructure icon by dragging
- [ ] **INFRA-05**: User can delete infrastructure with confirmation
- [ ] **INFRA-06**: Infrastructure stored with normalized coordinates (type, x, y)
- [ ] **INFRA-07**: Infrastructure scoped to room zones (only visible when room displayed)

### Measurement & Calibration (MEAS)

- [ ] **MEAS-01**: User can calibrate floor plan scale using two-point calibration workflow
- [ ] **MEAS-02**: Two-point calibration: user clicks two points, enters known real-world distance
- [ ] **MEAS-03**: Calibration validation (minimum distance checks, sanity validation for unrealistic scales)
- [ ] **MEAS-04**: Visual feedback during calibration (real-time calculation preview)
- [ ] **MEAS-05**: Calibration stored per floor plan (pixels-per-unit ratio)
- [ ] **MEAS-06**: User can access measure tool from toolbar
- [ ] **MEAS-07**: Measure tool: click two points → display real-world distance
- [ ] **MEAS-08**: Coordinate display shown when using measure tool (hover near crosshairs)
- [ ] **MEAS-09**: Coordinates hidden from main UI (background data only, not prominent display)
- [ ] **MEAS-10**: Measurement service transforms normalized coordinates to real-world units

### Data Export (EXPORT)

- [x] **EXPORT-01**: User can export assets table to CSV
- [x] **EXPORT-02**: User can export locations hierarchy to CSV
- [x] **EXPORT-03**: User can export asset types to CSV
- [x] **EXPORT-04**: CSV exports use UTF-8 BOM encoding for Excel compatibility
- [x] **EXPORT-05**: CSV exports include headers and predictable column order
- [x] **EXPORT-06**: CSV field quoting to prevent data corruption through Excel
- [x] **EXPORT-07**: User can select export destination path via file dialog

### Pan & Zoom Controls (NAV)

- [ ] **NAV-01**: User can pan canvas by click-dragging background
- [ ] **NAV-02**: User can zoom canvas using scroll wheel (zoom to cursor position)
- [ ] **NAV-03**: User can zoom using +/- buttons in zoom controls panel
- [ ] **NAV-04**: User can reset zoom to fit entire floor plan in viewport
- [ ] **NAV-05**: Zoom preserves center point when viewport resizes
- [ ] **NAV-06**: Pan/zoom state preserved when switching between locations
- [ ] **NAV-07**: Zoom limits (min 10%, max 500%) to prevent unusable states

## v2 Requirements (Deferred)

### Data Import (Deferred)

- [ ] **IMPORT-01**: CSV import for bulk asset creation with validation preview
- [ ] **IMPORT-02**: Import error reporting and field mapping configuration
- [ ] **IMPORT-03**: Duplicate detection during CSV import

### Data Quality (Deferred)

- [ ] **QUALITY-01**: Asset completeness tracking (required fields filled)
- [ ] **QUALITY-02**: Data quality dashboard showing profile completeness
- [ ] **QUALITY-03**: Bulk update capabilities for asset fields
- [ ] **QUALITY-04**: Asset history/changelog tracking (audit log)

### Multi-User Collaboration (Deferred)

- [ ] **MULTI-01**: PostgreSQL repository implementation (migration from SQLite)
- [ ] **MULTI-02**: User authentication (email/password)
- [ ] **MULTI-03**: Basic role-based permissions (view-only, editor, admin)
- [ ] **MULTI-04**: Multi-device sync capabilities
- [ ] **MULTI-05**: Cloud object storage for floor plan images (S3/Azure Blob)
- [ ] **MULTI-06**: Database migration tooling (SQLite → PostgreSQL)

### Advanced Features (Deferred)

- [ ] **ADV-01**: Visual search on floor plan (filter assets, highlight markers)
- [ ] **ADV-02**: Mobile-optimized view (touch-friendly controls)
- [ ] **ADV-03**: Asset status tracking (in service, under maintenance, retired)
- [ ] **ADV-04**: Photo attachments per asset
- [ ] **ADV-05**: Print/export floor plan view to PDF
- [ ] **ADV-06**: QR code generation per asset
- [ ] **ADV-07**: Custom asset status badges on floor plan markers
- [ ] **ADV-08**: Copy/paste for room zones, furniture, asset placements
- [ ] **ADV-09**: Multi-select for bulk operations
- [ ] **ADV-10**: Undo/redo for spatial edits
- [ ] **ADV-11**: Snap-to-grid for precise alignment
- [ ] **ADV-12**: Keyboard shortcuts for common tools

## Out of Scope

### Explicitly Excluded (with Rationale)

- **Real-time multi-user collaboration (Google Docs style)** — Complex operational transform/CRDT logic, websocket infrastructure; deferred to v2 with simpler last-write-wins + change log
- **Offline-first architecture** — Significant complexity; defer until field connectivity issues proven
- **Built-in CAD floor plan editor** — Massive scope duplicating existing CAD tools; users import existing floor plans instead
- **Mobile native apps (iOS/Android)** — 2-3x development cost, app store approval; use responsive web design for mobile access
- **Real-time location tracking (GPS/RFID)** — Requires expensive hardware infrastructure; manual location updates sufficient for v1
- **Preventive maintenance scheduling** — Complex CMMS functionality; defer until maintenance tracking proves critical
- **Work order management** — Full CMMS features out of scope; focus on spatial planning
- **Advanced analytics/BI dashboard** — Premature for early stage; CSV export lets users analyze in Excel/Power BI
- **3D floor visualization** — High complexity; 2D floor plans sufficient for v1 validation
- **Integration marketplace** — Each integration is maintenance burden; CSV export serves as universal adapter
- **Automated equipment detection (computer vision)** — Unreliable, requires training data; manual placement more accurate
- **AR floor plan overlay** — Gimmick without clear workflow benefit; standard 2D floor plan sufficient
- **Blockchain asset tracking** — Complexity without clear benefit; standard audit log sufficient

## Success Criteria

### Must Achieve (v1 Launch)

1. **Core workflow works end-to-end:**
   - User opens database → navigates tree to Floor → floor plan displays
   - User draws room zones → clicks room in tree → zooms into room
   - User drags asset icon from toolbar → drops on canvas → links to asset
   - User places furniture as resizable rectangle → resizes to real dimensions
   - User calibrates scale → measures distance between two points → sees real-world measurement
   - User exports assets to CSV → opens in Excel without corruption

2. **Spatial planning interface is intuitive:**
   - User discovers drag-to-place workflow without documentation
   - Room zone colors clearly distinguish different areas
   - Asset/furniture/infrastructure visually distinct on canvas
   - Pan/zoom controls feel responsive and predictable

3. **Data integrity guaranteed:**
   - Normalized coordinates prevent resolution-dependent bugs
   - CSV exports roundtrip cleanly through Excel (UTF-8 BOM, field quoting)
   - SQLite database remains stable (or warning prevents cloud-synced folder usage)
   - Calibration validation prevents systematic measurement errors

4. **Performance acceptable:**
   - Canvas remains responsive with 100+ markers per floor plan
   - Pan/zoom feels smooth (60fps target)
   - Floor plan image loads within 2 seconds for typical 5MB TIFF

## Traceability

### Requirements → Phases Mapping

| Requirement ID | Phase | Status |
|----------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| FOUND-07 | Phase 1 | Pending |
| FOUND-08 | Phase 1 | Pending |
| FOUND-09 | Phase 1 | Pending |
| FOUND-10 | Phase 1 | Pending |
| ASSET-01 | Phase 2 | Complete (02-03) |
| ASSET-02 | Phase 2 | Complete (02-03) |
| ASSET-03 | Phase 2 | Complete (02-03) |
| ASSET-04 | Phase 2 | Complete (02-03) |
| ASSET-05 | Phase 2 | Pending |
| ASSET-06 | Phase 2 | Complete (02-03) |
| ASSET-07 | Phase 2 | Complete (02-03) |
| ASSET-08 | Phase 2 | Complete (02-03) |
| LOC-01 | Phase 2 | Complete |
| LOC-02 | Phase 2 | Complete |
| LOC-03 | Phase 2 | Complete |
| LOC-04 | Phase 2 | Complete |
| LOC-05 | Phase 2 | Complete |
| LOC-06 | Phase 2 | Complete |
| EXPORT-01 | Phase 2 | Complete |
| EXPORT-02 | Phase 2 | Complete |
| EXPORT-03 | Phase 2 | Complete |
| EXPORT-04 | Phase 2 | Complete |
| EXPORT-05 | Phase 2 | Complete |
| EXPORT-06 | Phase 2 | Complete |
| EXPORT-07 | Phase 2 | Complete |
| UI-01 | Phase 3 | Complete |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 3 | Pending |
| UI-06 | Phase 3 | Pending |
| UI-07 | Phase 3 | Pending |
| UI-08 | Phase 3 | Pending |
| UI-09 | Phase 3 | Complete |
| NAV-01 | Phase 3 | Pending |
| NAV-02 | Phase 3 | Pending |
| NAV-03 | Phase 3 | Pending |
| NAV-04 | Phase 3 | Pending |
| NAV-05 | Phase 3 | Pending |
| NAV-06 | Phase 3 | Pending |
| NAV-07 | Phase 3 | Pending |
| FLOOR-01 | Phase 4 | Pending |
| FLOOR-02 | Phase 4 | Pending |
| FLOOR-03 | Phase 4 | Pending |
| FLOOR-04 | Phase 4 | Pending |
| FLOOR-05 | Phase 4 | Pending |
| FLOOR-06 | Phase 4 | Pending |
| FLOOR-07 | Phase 4 | Pending |
| FLOOR-08 | Phase 4 | Pending |
| ROOM-01 | Phase 5 | Pending |
| ROOM-02 | Phase 5 | Pending |
| ROOM-03 | Phase 5 | Pending |
| ROOM-04 | Phase 5 | Pending |
| ROOM-05 | Phase 5 | Pending |
| ROOM-06 | Phase 5 | Pending |
| ROOM-07 | Phase 5 | Pending |
| ROOM-08 | Phase 5 | Pending |
| ROOM-09 | Phase 5 | Pending |
| PLACE-01 | Phase 6 | Pending |
| PLACE-02 | Phase 6 | Pending |
| PLACE-03 | Phase 6 | Pending |
| PLACE-04 | Phase 6 | Pending |
| PLACE-05 | Phase 6 | Pending |
| PLACE-06 | Phase 6 | Pending |
| PLACE-07 | Phase 6 | Pending |
| PLACE-08 | Phase 6 | Pending |
| PLACE-09 | Phase 6 | Pending |
| PLACE-10 | Phase 6 | Pending |
| PLACE-11 | Phase 6 | Pending |
| FURN-01 | Phase 7 | Pending |
| FURN-02 | Phase 7 | Pending |
| FURN-03 | Phase 7 | Pending |
| FURN-04 | Phase 7 | Pending |
| FURN-05 | Phase 7 | Pending |
| FURN-06 | Phase 7 | Pending |
| FURN-07 | Phase 7 | Pending |
| FURN-08 | Phase 7 | Pending |
| FURN-09 | Phase 7 | Pending |
| FURN-10 | Phase 7 | Pending |
| INFRA-01 | Phase 7 | Pending |
| INFRA-02 | Phase 7 | Pending |
| INFRA-03 | Phase 7 | Pending |
| INFRA-04 | Phase 7 | Pending |
| INFRA-05 | Phase 7 | Pending |
| INFRA-06 | Phase 7 | Pending |
| INFRA-07 | Phase 7 | Pending |
| MEAS-01 | Phase 8 | Pending |
| MEAS-02 | Phase 8 | Pending |
| MEAS-03 | Phase 8 | Pending |
| MEAS-04 | Phase 8 | Pending |
| MEAS-05 | Phase 8 | Pending |
| MEAS-06 | Phase 8 | Pending |
| MEAS-07 | Phase 8 | Pending |
| MEAS-08 | Phase 8 | Pending |
| MEAS-09 | Phase 8 | Pending |
| MEAS-10 | Phase 8 | Pending |

**Coverage:** 102/102 requirements mapped (100%)

### Research → Requirements Coverage

- **FOUND-01 to FOUND-10**: Addresses ARCHITECTURE.md normalized coordinates, repository pattern, file storage abstraction
- **ASSET-01 to ASSET-08**: Addresses FEATURES.md table stakes "Asset Inventory CRUD, Asset Search/Filter"
- **LOC-01 to LOC-06**: Addresses FEATURES.md table stakes "Hierarchical Location Structure"
- **UI-01 to UI-09**: Implements PROJECT.md vision "Three-panel layout, toolbar palette"
- **FLOOR-01 to FLOOR-08**: Addresses FEATURES.md table stakes "Import Floor Plan Image, Pan and Zoom"
- **ROOM-01 to ROOM-09**: Implements PROJECT.md vision "Draw room boundaries as colored zones, zoom into room"
- **PLACE-01 to PLACE-11**: Implements PROJECT.md vision "Drag-to-place assets from toolbar, visual icons"
- **FURN-01 to FURN-10**: Implements PROJECT.md vision "Resizable furniture rectangles, rotation"
- **INFRA-01 to INFRA-07**: Implements PROJECT.md vision "Infrastructure placement (power/network)"
- **MEAS-01 to MEAS-10**: Addresses FEATURES.md table stakes "Scale Calibration, Distance Measurement Tool"
- **EXPORT-01 to EXPORT-07**: Addresses FEATURES.md table stakes "CSV Export" + PITFALLS.md CSV corruption prevention
- **NAV-01 to NAV-07**: Addresses FEATURES.md table stakes "Pan and Zoom"

### Pitfalls Addressed

- **PITFALL #1 (SQLite corruption in cloud-synced folders)**: FOUND-07 database path configurability, warning against OneDrive/SharePoint
- **PITFALL #2 (Canvas performance degradation)**: Architecture will implement viewport culling, layer separation (addressed during Phase 3 planning)
- **PITFALL #3 (Inaccurate calibration)**: MEAS-03 validation, MEAS-04 visual feedback, sanity checks
- **PITFALL #4 (CSV corruption through Excel)**: EXPORT-04 UTF-8 BOM, EXPORT-06 field quoting
- **PITFALL #5 (Pixel coordinates failing across zoom)**: FOUND-01 normalized coordinates from day one

---

**Total v1 Requirements:** 102
**Total v2 Requirements:** 20
**Explicitly Excluded:** 13
