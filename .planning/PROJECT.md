# Visual Asset Mapper - Spatial Planning Interface

## What This Is

A desktop spatial planning tool for equipment asset management. Users import floor plans, define room boundaries visually, and place assets/furniture/infrastructure using a drag-and-drop interface. Navigate via a location tree (Building→Floor→Room), zoom into rooms to see detail, and manage assets through a visual canvas with calibrated measurements.

## Core Value

Spatial planning interface that lets you visually define rooms, drag-place assets and furniture, and manage infrastructure (power/network) on floor plans with real-world measurements.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Spatial Planning Interface:**
- [ ] Three-panel layout: location tree (left) + canvas (center) + details panel (right)
- [ ] Bottom toolbar with Edit/Move/Delete tools and asset type palette
- [ ] Navigate location tree to load floor plans (Building→Floor level)
- [ ] Draw room boundaries as colored zones on floor plans
- [ ] Click room in tree → zoom into that room's bounding box
- [ ] Details panel shows asset counts by type with "Add..." buttons
- [ ] Drag asset icon from toolbar OR click "Add..." → icon follows cursor → drop to place
- [ ] Pan/zoom canvas with standard controls (drag to pan, scroll to zoom)

**Asset Types & Placement:**
- [ ] Asset types: PC, Phone, Printer, Monitor, Electronics, Custom Machinery
- [ ] Drag asset icon from toolbar to canvas, drop to place at coordinates
- [ ] Click "Add..." in details panel → asset icon follows mouse → click to place
- [ ] Visual asset icons on canvas (category-specific icons)
- [ ] Click asset → show details/edit in right panel
- [ ] Move/delete assets via toolbar tools

**Furniture Placement:**
- [ ] Furniture types: Desk, Bench, Custom
- [ ] Place furniture as resizable rectangles on canvas
- [ ] Resize furniture to represent real floor space (width, length)
- [ ] Rotate furniture pieces
- [ ] Furniture appears visually distinct from assets (outlined shapes vs icons)

**Infrastructure Placement:**
- [ ] Infrastructure types: Power outlet, Network port
- [ ] Place infrastructure icons on canvas (drag from toolbar)
- [ ] Visual distinction from assets (different icon style)

**Room Zone Management:**
- [ ] Draw room boundaries on floor plans (colored rectangles)
- [ ] Link room zones to Room locations in hierarchy
- [ ] Visual color coding per room (yellow, cyan, magenta, orange per mockup)
- [ ] Zoom into room → canvas shows only that room's bounds
- [ ] Asset/furniture/infrastructure scoped to room zones

**Measurement & Calibration:**
- [ ] Two-point calibration workflow (known distance)
- [ ] Measure tool: click two points → show real-world distance
- [ ] Coordinate display when using measure tool (hover near crosshairs)
- [ ] Coordinates hidden from main UI (background data only)

**Data Model & Hierarchy:**
- [ ] Locations: Building → Floor → Room hierarchy (existing structure preserved)
- [ ] Asset Types: PC, Phone, Printer, Monitor, Electronics, Machinery (replaces "categories")
- [ ] Room Zones: Visual bounding boxes on floor plans (x, y, width, height, color)
- [ ] Furniture Items: Resizable rectangles (type, x, y, width, height, rotation)
- [ ] Infrastructure Items: Point placements (type, x, y)
- [ ] Asset Placements: Icons on canvas (assetId, x, y)

**Data Export:**
- [ ] CSV export for assets table
- [ ] CSV export for locations and asset types
- [ ] Excel-compatible exports (UTF-8, headers, predictable formats)

**Database & Storage:**
- [ ] Single-file database (SQLite) with configurable path
- [ ] "Open database" and "Create new database" workflows
- [ ] Support for cloud-synced folders (OneDrive/SharePoint)
- [ ] Remember recent projects

### Out of Scope

- Real-time multi-user editing — Single-writer pattern for v1
- Mobile app — Desktop first
- Authentication/authorization — Future consideration
- PDF floor plan import — Image files (PNG/JPEG/TIFF) for v1
- Advanced measurement features (area, polygons) — Linear distance for v1
- 3D floor plans — 2D images for v1
- Auto-routing for cables/infrastructure — Manual placement for v1

## Context

**Target Environment:**
- Primary platform: Windows desktop (Tauri app)
- Storage: Local file system with cloud sync (OneDrive/SharePoint)
- Future: Web deployment, Microsoft Teams integration

**Use Case:**
Equipment and facility management across healthcare/corporate environments where visual spatial planning is critical. Users need to see room layouts, asset placement, furniture arrangement, and infrastructure (power/network) on floor plans with accurate measurements.

**User Journey:**
1. Open database, navigate tree to Building → Ground Floor
2. Floor plan displays in canvas with existing room zones (colored boxes)
3. Click "Room1" in tree → canvas zooms into yellow room zone
4. Right panel shows: "PCs: 10 [Add...], Monitors: 20 [Add...], Phones: 5 [Add...]"
5. Click "Add..." next to PCs → PC icon appears under mouse → click canvas to place
6. OR drag PC icon from bottom toolbar → drop on canvas
7. Place furniture: drag "Desk" from toolbar → resize rectangle to match real desk size
8. Place infrastructure: drag power outlet icon → drop at wall location
9. Use measure tool: calibrate scale, measure distance between two points
10. Export to CSV for asset inventory report

**Example Scenarios:**
- Facility manager opens Ground Floor plan, sees all rooms as colored zones
- Zooms into Server Room, sees all PCs/monitors/network ports visually placed
- Drags new UPS icon from toolbar to corner of room
- Resizes desk rectangle to match real-world dimensions (2m x 1m)
- Measures distance from desk to nearest power outlet (validates cable length)
- Exports all assets to CSV for budget planning

## Constraints

- **Platform**: Windows desktop (Tauri 2 app) — Primary user environment
- **Data portability**: Single-file database for easy cloud sync — Multi-device access
- **Scalability architecture**: Abstracted data access layer for future PostgreSQL migration
- **Tech stack**: SQLite → PostgreSQL path, React + TypeScript UI, Canvas-based rendering
- **Performance**: Handle hundreds of floor plans, tens of thousands of assets
- **Excel compatibility**: CSV exports must open cleanly in Excel

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SQLite for v1 database | Single-file, portable, cloud-sync friendly | Implemented (Phase 1) |
| Abstracted data access layer | Enable future PostgreSQL migration | Implemented (Phase 1) |
| Two-point calibration | Accurate real-world measurements | Implemented (Phase 1) |
| Hierarchical location model | Matches physical reality (Building→Floor→Room) | Implemented (Phase 1) |
| Canvas-based rendering | Flexible spatial UI for room zones, assets, furniture | Pending |
| Room zones as visual bounding boxes | User-friendly drill-down without coordinate entry | Pending |
| Drag-to-place asset workflow | Intuitive spatial placement | Pending |
| Resizable furniture rectangles | Represent real floor space accurately | Pending |
| Asset types (not categories) | Clearer terminology for spatial context | Pending |
| Toolbar palette for quick placement | Fast workflow for adding multiple items | Pending |

## Tech Stack

- **Frontend**: React + TypeScript, Material-UI v5
- **Canvas Rendering**: HTML5 Canvas API (room zones, furniture, assets, infrastructure)
- **Desktop**: Tauri 2 (Rust + WebView)
- **Database**: SQLite (better-sqlite3) → Drizzle ORM
- **Drag-Drop**: Custom canvas-based drag handlers
- **State Management**: React hooks (useState, useReducer for complex canvas state)
- **File Handling**: Tauri file dialogs, image processing (canvas API, tiff.js)

## Phase Overview (Draft)

**Phase 1: Foundation** (Completed - preserve database/locations/calibration)
**Phase 2: Spatial UI Shell** - Three-panel layout, location tree, canvas, details panel, toolbar
**Phase 3: Room Zone Drawing** - Draw/edit colored room boundaries, zoom into rooms
**Phase 4: Asset Placement** - Drag-to-place workflow, asset type palette, placement storage
**Phase 5: Furniture Placement** - Resizable rectangle drawing, furniture types
**Phase 6: Infrastructure Placement** - Power/network icon placement
**Phase 7: Measure Tool** - Coordinate display, calibrated distance measurement
**Phase 8: CSV Export Adapter** - Update export for new spatial structure

---
*Vision updated: 2026-02-20*
*Reflects spatial planning interface from mockup (eg/mockup.png)*
