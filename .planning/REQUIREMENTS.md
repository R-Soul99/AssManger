# Requirements: Visual Asset Mapper

**Defined:** 2026-01-28
**Core Value:** Visual, spatially-aware asset tracking with calibrated measurements that makes equipment location and details instantly accessible.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation & Data Model

- [x] **FOUN-01**: Domain entities implemented (Asset, FloorPlan, Marker, Location hierarchy, Calibration)
- [x] **FOUN-02**: Repository interfaces defined for database abstraction (IAssetRepository, IFloorPlanRepository, IMarkerRepository, IFileStorageRepository)
- [x] **FOUN-03**: SQLite repository implementations with database migrations
- [x] **FOUN-04**: Normalized coordinate system (0.0-1.0 range) with pixel transformation service
- [x] **FOUN-05**: Local file storage service for floor plan images with relative path handling

### Location Hierarchy

- [x] **LOC-01**: User can create/edit/delete sites
- [x] **LOC-02**: User can create/edit/delete buildings within sites
- [x] **LOC-03**: User can create/edit/delete floors within buildings
- [x] **LOC-04**: User can create/edit/delete rooms within floors
- [x] **LOC-05**: System enforces hierarchical integrity (no orphaned locations)

### Equipment Categories

- [x] **CAT-01**: User can create/edit/delete equipment categories
- [x] **CAT-02**: User can assign icon and color to each category
- [x] **CAT-03**: Categories have name, description, and default metadata fields

### Asset Management

- [ ] **AST-01**: User can create asset with all required fields (asset tag, category, location, description)
- [ ] **AST-02**: User can edit asset details (serial number, phone/extension, status, owner, cost centre, notes)
- [ ] **AST-03**: User can delete assets with confirmation
- [ ] **AST-04**: User can view asset list with sortable columns (category, location, asset tag, status)
- [ ] **AST-05**: User can filter assets by site/building/floor/room
- [ ] **AST-06**: User can filter assets by category
- [ ] **AST-07**: User can filter assets by status
- [ ] **AST-08**: User can search assets by asset tag, description, serial number, phone number
- [ ] **AST-09**: User can view asset detail page showing all fields and linked floor plan markers
- [ ] **AST-10**: System tracks created/updated timestamps for each asset

### CSV Export

- [ ] **CSV-01**: User can export assets table to CSV with UTF-8 BOM encoding
- [ ] **CSV-02**: User can export locations table to CSV
- [ ] **CSV-03**: User can export categories table to CSV
- [ ] **CSV-04**: CSV exports open correctly in Excel without encoding issues
- [ ] **CSV-05**: CSV exports include headers and properly quoted fields

### Floor Plan Management

- [ ] **FLP-01**: User can import floor plan image (PNG/JPEG) and assign to building/floor
- [ ] **FLP-02**: User can view list of all floor plans organized by site/building/floor
- [ ] **FLP-03**: User can edit floor plan metadata (name, building/floor assignment)
- [ ] **FLP-04**: User can delete floor plan (with warning if markers exist)
- [ ] **FLP-05**: System supports multiple floor plans per floor (different areas/zones)
- [ ] **FLP-06**: Floor plan images stored with database-relative paths

### Floor Plan Viewer

- [ ] **VWR-01**: User can view floor plan with pan (drag) and zoom (mouse wheel/pinch) controls
- [ ] **VWR-02**: User can see all asset markers placed on the floor plan
- [ ] **VWR-03**: Markers display with category-specific icons and colors
- [ ] **VWR-04**: User can click marker to see asset summary (name, asset tag, category, status)
- [ ] **VWR-05**: User can navigate from marker popup to full asset detail view
- [ ] **VWR-06**: Viewer performs smoothly with 500+ markers (viewport culling implemented)
- [ ] **VWR-07**: User can toggle marker visibility by category
- [ ] **VWR-08**: User can filter markers by asset status and see filtered markers highlighted on floor plan

### Scale Calibration

- [ ] **CAL-01**: User can activate two-point calibration tool on a floor plan
- [ ] **CAL-02**: User can click two points on the floor plan representing a known real-world distance
- [ ] **CAL-03**: User can enter the real-world distance and select units (metres/feet)
- [ ] **CAL-04**: System calculates and stores scale (units per pixel) for the floor plan
- [ ] **CAL-05**: System validates calibration (warns if scale suggests unrealistic values like 1 pixel = 100 meters)
- [ ] **CAL-06**: User can see calibration status and scale value displayed on floor plan
- [ ] **CAL-07**: User can re-calibrate floor plan at any time
- [ ] **CAL-08**: System shows visual feedback during calibration (line between points, calculated distance preview)

### Marker Management

- [ ] **MRK-01**: User can click on floor plan to place new marker
- [ ] **MRK-02**: User can link new marker to existing asset (via search/dropdown)
- [ ] **MRK-03**: User can create new asset directly from marker placement workflow
- [ ] **MRK-04**: User can drag marker to reposition it on floor plan
- [ ] **MRK-05**: User can delete marker from floor plan
- [ ] **MRK-06**: System stores marker coordinates as normalized values (0.0-1.0)
- [ ] **MRK-07**: System transforms normalized coordinates to pixels during rendering
- [ ] **MRK-08**: Marker icons/colors automatically match linked asset's category
- [ ] **MRK-09**: User can see marker count per floor plan

### Distance Measurement

- [ ] **MSR-01**: User can activate measurement tool on calibrated floor plan
- [ ] **MSR-02**: User can click two points to measure distance between them
- [ ] **MSR-03**: System calculates and displays real-world distance using calibration data
- [ ] **MSR-04**: System shows measurement line with distance label
- [ ] **MSR-05**: System warns if floor plan is not calibrated when measurement tool activated
- [ ] **MSR-06**: User can clear measurements and measure multiple distances

### Database & Project Management

- [x] **DB-01**: User can create new database file at chosen location
- [x] **DB-02**: User can open existing database file
- [x] **DB-03**: System remembers recently opened databases
- [x] **DB-04**: System detects if database path is in cloud-synced folder (OneDrive/SharePoint) and warns user
- [x] **DB-05**: System recommends storing database in %LOCALAPPDATA% for single-user scenarios
- [x] **DB-06**: User can backup database (copy file to chosen location)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Data Import & Quality

- **IMP-01**: User can import assets from CSV file with preview and validation
- **IMP-02**: User can map CSV columns to asset fields during import
- **IMP-03**: System validates imported data and reports errors before final import
- **DQ-01**: User can see data quality dashboard showing asset profile completeness
- **DQ-02**: User can bulk update assets from filtered list

### Asset Tracking

- **TRK-01**: User can set asset status with visual indicators (Active, Pending Install, Decommissioned, Faulty, Maintenance Due)
- **TRK-02**: User can view asset history showing all changes with timestamps and user attribution
- **TRK-03**: System tracks who created/modified each asset

### Reporting

- **RPT-01**: User can export floor plan view to PDF with visible markers
- **RPT-02**: User can include asset list in PDF export
- **RPT-03**: User can generate reports filtered by location/category/status

## v3+ Requirements

Future consideration for multi-user deployments.

### Multi-User Database

- **MU-01**: System supports PostgreSQL database backend
- **MU-02**: System provides migration tool to convert SQLite database to PostgreSQL
- **MU-03**: Repository implementations support both SQLite and PostgreSQL without business logic changes

### Cloud Storage

- **CLD-01**: System supports cloud object storage (S3/Azure Blob/GCS) for floor plan images
- **CLD-02**: System migrates local images to cloud storage during multi-user setup

### Authentication & Collaboration

- **AUTH-01**: User can authenticate with username/password
- **AUTH-02**: System supports basic roles (Admin, Editor, Viewer)
- **SYNC-01**: Multiple users can access same database concurrently without conflicts

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time GPS/RFID tracking | Too expensive/complex for initial market; static location mapping is core value |
| Built-in CAD editor | Duplicates existing tools; users have CAD/PDF exports already |
| Native mobile apps | PWA/responsive web is more maintainable; defer until mobile workflows validated |
| Real-time collaboration (Google Docs style) | Over-engineered for asset management use case; occasional sync sufficient |
| Unlimited custom fields | Creates database bloat and UI complexity; fixed schema with notes field for flexibility |
| Integration marketplace | Maintenance burden without proven demand; direct integrations when needed |
| Blockchain for audit trail | Complexity without ROI; traditional changelog sufficient |
| AR overlays | Unproven value for asset management; defer until use case emerges |
| Automated equipment detection | Computer vision complexity; manual placement is reliable and sufficient |
| 3D floor visualization | High complexity; 2D floor plans meet user needs for v1 |
| Preventive maintenance scheduling | Full CMMS functionality out of scope; defer until location tracking validated |
| Work order management | Separate domain; focus on location/mapping value first |
| Video floor plans | Storage/complexity; static images sufficient |
| OAuth login (Google/Microsoft) | Username/password sufficient for v1; add if enterprise demand emerges |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Complete |
| FOUN-02 | Phase 1 | Complete |
| FOUN-03 | Phase 1 | Complete |
| FOUN-04 | Phase 1 | Complete |
| FOUN-05 | Phase 1 | Complete |
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| DB-03 | Phase 1 | Complete |
| DB-04 | Phase 1 | Complete |
| DB-05 | Phase 1 | Complete |
| DB-06 | Phase 1 | Complete |
| LOC-01 | Phase 2 | Complete |
| LOC-02 | Phase 2 | Complete |
| LOC-03 | Phase 2 | Complete |
| LOC-04 | Phase 2 | Complete |
| LOC-05 | Phase 2 | Complete |
| CAT-01 | Phase 2 | Complete |
| CAT-02 | Phase 2 | Complete |
| CAT-03 | Phase 2 | Complete |
| AST-01 | Phase 3 | Pending |
| AST-02 | Phase 3 | Pending |
| AST-03 | Phase 3 | Pending |
| AST-04 | Phase 3 | Pending |
| AST-05 | Phase 3 | Pending |
| AST-06 | Phase 3 | Pending |
| AST-07 | Phase 3 | Pending |
| AST-08 | Phase 3 | Pending |
| AST-09 | Phase 3 | Pending |
| AST-10 | Phase 3 | Pending |
| CSV-01 | Phase 3 | Pending |
| CSV-02 | Phase 3 | Pending |
| CSV-03 | Phase 3 | Pending |
| CSV-04 | Phase 3 | Pending |
| CSV-05 | Phase 3 | Pending |
| FLP-01 | Phase 4 | Pending |
| FLP-02 | Phase 4 | Pending |
| FLP-03 | Phase 4 | Pending |
| FLP-04 | Phase 4 | Pending |
| FLP-05 | Phase 4 | Pending |
| FLP-06 | Phase 4 | Pending |
| VWR-01 | Phase 5 | Pending |
| VWR-02 | Phase 5 | Pending |
| VWR-03 | Phase 5 | Pending |
| VWR-04 | Phase 5 | Pending |
| VWR-05 | Phase 5 | Pending |
| VWR-06 | Phase 5 | Pending |
| VWR-07 | Phase 5 | Pending |
| VWR-08 | Phase 5 | Pending |
| MRK-01 | Phase 6 | Pending |
| MRK-02 | Phase 6 | Pending |
| MRK-03 | Phase 6 | Pending |
| MRK-04 | Phase 6 | Pending |
| MRK-05 | Phase 6 | Pending |
| MRK-06 | Phase 6 | Pending |
| MRK-07 | Phase 6 | Pending |
| MRK-08 | Phase 6 | Pending |
| MRK-09 | Phase 6 | Pending |
| CAL-01 | Phase 7 | Pending |
| CAL-02 | Phase 7 | Pending |
| CAL-03 | Phase 7 | Pending |
| CAL-04 | Phase 7 | Pending |
| CAL-05 | Phase 7 | Pending |
| CAL-06 | Phase 7 | Pending |
| CAL-07 | Phase 7 | Pending |
| CAL-08 | Phase 7 | Pending |
| MSR-01 | Phase 7 | Pending |
| MSR-02 | Phase 7 | Pending |
| MSR-03 | Phase 7 | Pending |
| MSR-04 | Phase 7 | Pending |
| MSR-05 | Phase 7 | Pending |
| MSR-06 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 71 total
- Mapped to phases: 71 (100% coverage)
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
