# Environment

- Rust, Node, and Gemini CLI are installed and on PATH.
- Do not re-run installation or version check commands.
- Assume `rustc`, `cargo`, `node`, `npm`, and `gemini` all work.

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Visual, spatially-aware asset tracking with calibrated measurements that makes equipment location and details instantly accessible.

**Current focus:** Phase 6 - Marker Management

## Current Position

Phase: 6 of 7 (Marker Management) - IN PROGRESS
Plan: 04 of 5 complete (06-01, 06-02, 06-03, 06-04 done)
Status: Plan 06-04 complete — AssetLinkDialog (Autocomplete search) and QuickCreateAssetForm (react-hook-form+zod, optional description/location)
Last activity: 2026-02-19 - Plan 06-04 executed (AssetLinkDialog, QuickCreateAssetForm, CreateAssetDto.locationId optional)

Progress: [█████████░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 25
- Average duration: ~10 min
- Total execution time: ~3.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | 23min | 5min |
| 02 | 4 | 103min | 26min |
| 03 | 3 | 14min | 5min |
| 04 | 4 | 19min | 5min |
| 05 | 5 | ~45min | ~9min |
| 06 | 4 | ~29min | ~7min |

**Recent Trend:**
- Last 5 plans: 5min, 5min, 5min, 2min, 12min
- Trend: Consistent fast execution - established patterns, clean architecture, type-safe utilities

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: SQLite for v1 database (single-file, portable, cloud-sync friendly, zero server setup)
- Phase 1: Abstracted data access layer (enable future migration to client-server architecture)
- Phase 1: Two-point calibration for floor plans (accurate real-world measurements)
- Phase 1: Hierarchical location model (matches physical reality and organizational structure)
- Plan 01-01: Manually scaffolded Tauri 2 (create-tauri-app CLI issues)
- Plan 01-01: TypeScript strict mode enabled for type safety
- Plan 01-01: Clean architecture structure from start (prevents mixing concerns)
- Plan 01-02: Zod schemas with safeParse factory pattern (type-safe runtime validation)
- Plan 01-02: Silent coordinate clamping (0.0-1.0) handles floating point edge cases gracefully
- Plan 01-02: Immutable entities with private data and getters (enforces controlled updates through repository)
- Plan 01-03: Normalized coordinates as REAL type in schema (0.0-1.0 range for viewport independence)
- Plan 01-03: WAL mode enabled by default (better concurrency and corruption resistance)
- Plan 01-03: Cascade delete strategy for hierarchical data cleanup
- Plan 01-04: Repository interfaces define framework-agnostic contracts for future database migration
- Plan 01-04: Factory pattern with lazy initialization and singleton for efficient repository access
- Plan 01-04: Domain entity mapping in repositories enforces validation at persistence boundary
- Plan 01-04: Type casting for enum filters in Drizzle queries to satisfy TypeScript strict mode
- Plan 01-05: Pixel coordinates rounded to nearest integer for rendering precision
- Plan 01-05: Cloud folder detection via environment variables + path patterns (OneDrive, Dropbox, SharePoint, Google Drive)
- Plan 01-05: Session-based warning tracking prevents repetitive nagging
- Plan 01-05: File storage uses relative paths for database portability
- Plan 01-06: ProjectService manages project lifecycle (create, open, recent projects)
- Plan 01-06: .assetmap extension for databases (supports opening .db/.sqlite)
- Plan 01-06: Recent projects stored in localStorage (max 5)
- Plan 01-06: Default project location is %LOCALAPPDATA%\AssManger
- Plan 02-01: Curated 20 icon set from react-icons for better UX than full library
- Plan 02-01: react-colorful for lightweight color picker (2KB vs 10KB+ alternatives)
- Plan 02-01: Strict null types (string | null) match database schema for type safety
- Plan 02-01: MUI v5 Stack/Box simpler than Grid for form layouts
- Plan 02-02: ServiceResult pattern for consistent error handling across service methods
- Plan 02-02: Hierarchy validation at service layer using existing Location.canHaveChildType()
- Plan 02-02: Circular reference prevention via isDescendantOf() tree traversal
- Plan 02-03: SimpleTreeView for hierarchical location display (sufficient for basic hierarchy)
- Plan 02-03: Icon-per-type visual differentiation (Site/Building/Floor/Room icons)
- Plan 02-03: Selection-driven action buttons (Add Child/Edit/Delete based on selected node)
- Plan 02-03: Fixed child type when adding from parent context (prevents hierarchy violations)
- Plan 02-03: Error alerts for service layer validation failures (dismissible, persistent)
- Plan 02-04: AssetWithRelations pattern for joined queries (repository handles joins, service coordinates, UI displays)
- Plan 02-04: Filter locations to Room/Floor types for asset assignment (assets belong to physical spaces)
- Plan 02-04: Recursive location path building in repository layer (centralized, cache-friendly)
- Plan 02-04: Dialog-based asset creation form (consistent with Category/Location UX pattern)
- Plan 02-04: Icon map shared across components for DRY principle and visual consistency
- Plan 03-01: Hybrid filtering strategy (DB handles text search, client handles hierarchical location filtering)
- Plan 03-01: Debounce search input by 300ms (prevents excessive database queries on every keystroke)
- Plan 03-01: Cascading location dropdowns (guides user through Site -> Building -> Floor -> Room hierarchy)
- Plan 03-02: Form schema uses z.string() for text fields (not .optional()) with DTO conversion at submit (avoids zodResolver type mismatch)
- Plan 03-02: Row click opens detail drawer; standalone edit button removed (drawer is single editing entry point)
- Plan 03-02: assignableLocations filtered to Room/Floor before passing to drawer (consistent with 02-04 pattern)
- Plan 03-03: CsvExportService stub created for parallel plan dependency (03-04 overwrites with full implementation)
- Plan 03-03: Sequential delete loop in bulk actions (SQLite write safety, simpler error handling than Promise.all)
- Plan 03-03: Column visibility merge strategy on init (new columns get defaults without wiping stored prefs)
- Plan 04-01: locationId nullable at import time (assigned later in detail view)
- Plan 04-01: display_order INTEGER DEFAULT 0 for drag-to-reorder persistence
- Plan 04-02: Canvas API + tiff.js for universal image format support (PNG/JPEG/BMP/TIFF)
- Plan 04-02: Max 4096px auto-resize prevents memory issues with large images
- Plan 04-02: Object URL cleanup via useEffect prevents blob URL memory leaks
- Plan 04-03: Separate DndContext per location group (drag-to-reorder only within same location)
- Plan 04-03: Full-page detail view instead of drawer (floor plan images need more preview space)
- Plan 04-03: Unassigned floor plans in non-sortable group (no locationId = no ordering context)
- Plan 04-03: Location dropdown filters to floor/building types (floor plans attach to physical layouts)
- Plan 04-03: 8px drag activation distance (prevents accidental drag when clicking to view details)
- Plan 04-04: Sequential delete loop for bulk operations (SQLite write safety, simpler error handling)
- Plan 04-04: Stepped per-plan confirmation for plans with markers (user sees marker count before confirming deletion)
- Plan 04-04: Selection mode toggle pattern (cleaner UI when not selecting, prevents accidental selections)
- Plan 06-01: Clamp coordinates in service moveMarker too (Marker.create clamps for placeMarker but update bypasses entity factory)
- Plan 06-01: markerVersion defaults to 0 in useMarkers (preserves single-argument caller compatibility)
- Plan 06-01: markerVersion increment pattern for hook re-fetch (setMarkerVersion(v => v + 1) triggers useEffect re-run)
- Plan 06-02: isEditMode state lives in FloorPlanViewer (not toolbar) so it flows down to FloorPlanCanvas in Plan 03
- Plan 06-02: Deferred isEditMode prop pass-through to FloorPlanCanvas until Plan 03 adds the prop type (avoids TypeScript error)
- Plan 06-02: EditLocationAltIcon chosen as most semantically accurate icon for marker placement/editing
- Plan 06-02: Active edit mode uses primary.light background + primary color to distinguish from default icon state
- Plan 06-03: dragStateRef + 6px DRAG_ACTIVATION_DISTANCE distinguishes click from drag without useState re-renders
- Plan 06-03: _selectedPlaceholder prefix satisfies noUnusedLocals while keeping state in FloorPlanViewer for Plan 04
- Plan 06-03: MarkerPopup rendered only in view mode (!isEditMode) — edit mode uses onMarkerEditSelect callback
- Plan 06-03: DragState interface defined inside component (not exported) — internal implementation detail
- Plan 06-04: AssetLinkDialog fetches all assets on open (not mount) to ensure fresh data each open
- Plan 06-04: QuickCreateAssetForm description fallback to tag value (entity requires min(1) — silent UX fill)
- Plan 06-04: CreateAssetDto.locationId changed to optional (string | undefined) to support optional location in quick-create
- Plan 06-04: Zod v4 uses z.number().min(1, msg) not z.number({ required_error }) which is Zod v3 API

### Pending Todos

**Plan 01-01 prerequisite:**
- Install Rust toolchain (rustup.rs) to enable Tauri development
- Verify with: `rustc --version` and `cargo --version`
- Test with: `npm run tauri dev` (should open desktop window)

### Blockers/Concerns

**Phase 1 Foundation:**
- ✓ Normalized coordinates (0.0-1.0) implemented in entities (01-02) and schema (01-03)
- ✓ Repository abstraction complete (01-04) - ready for future PostgreSQL migration
- ✓ Cloud folder detection service complete (01-05) - OneDrive, Dropbox, SharePoint, Google Drive detection
- ✓ Coordinate transformation service ready for marker rendering (01-05)
- ✓ File storage with database-relative paths for portability (01-05)

**Phase 2 Location Hierarchy & Categories:**
- ✓ Category CRUD with icon/color visual attributes complete (02-01)
- ✓ MUI integration established for future UI components (02-01)
- ✓ Location hierarchy service layer with integrity checks complete (02-02)
- ✓ Visual location tree with interactive CRUD complete (02-03)
- ✓ MUI X TreeView integration for hierarchical navigation (02-03)
- ✓ Asset management integration with categories and locations complete (02-04)
- ✓ AssetService layer with validation and relational queries (02-04)
- ✓ Enhanced asset form with visual category/location selectors (02-04)
- ✓ Asset list view with joined category/location data display (02-04)

**Phase 3 Asset Management & CSV Export:**
- ✓ Asset list with search, filter, sort hooks complete (03-01)
- ✓ Asset detail drawer with inline editing, validation, dirty-state, floor plan markers placeholder (03-02)
- ✓ CategoryData and AssetWithRelations barrel exports fixed (pre-existing bugs, resolved in 03-02)
- ✓ Column visibility (10 columns, localStorage persisted), bulk selection, bulk delete, bulk export (03-03)
- ✓ CSV export service with column-visibility-aware export, UTF-8 BOM, Explorer reveal (03-04)
- ✓ UAT: all 8 items passed (2026-02-04) — mock repos used for WebView testing

**Phase 4 Floor Plan Management:**
- ✓ Schema + Service + Mock complete (04-01) — nullable locationId, displayOrder, MockFloorPlanRepository
- ✓ Import workflow complete (04-02) — FloorPlanImportDialog, imageUtils, tiff.js integration, canvas processing
- ✓ Card list UI complete (04-03) — FloorPlanList, grouped by location, drag-to-reorder, detail/edit view, dnd-kit integration
- ✓ Delete safety complete (04-04) — FloorPlanDeleteDialog, FloorPlanBulkActions, selection mode, marker warnings, stepped confirmations

**Phase 5 Floor Plan Viewer:**
- ✓ Canvas infrastructure with HTML5 canvas + 1:1 pixel mapping complete (05-01)
- ✓ Pan/zoom with react-zoom-pan-pinch, direct feel, 50%-500% range (05-02)
- ✓ Marker rendering with category colors, initial-letter icons, click detection (05-03)
- ✓ MarkerPopup with react-laag edge-aware positioning, asset summary, View Details nav (05-04)
- ✓ Category toggle chips + status filter sidebar + 30% opacity dimming (05-05)
- ✓ FloorPlanCard View/Edit buttons + FloorPlanViewer back navigation wired
- Note: Viewport culling deferred per CONTEXT.md — load-all approach ships faster, optimize on real usage

**Phase 6 Marker Management:**
- ✓ MarkerService mutations (place/move/delete) + useMarkers refresh trigger with markerVersion (06-01)
- ✓ Edit Markers toggle button with active highlight + filteredMarkerCount display in toolbar (06-02)
- ✓ Canvas edit interactions: click-to-place placeholders, drag-to-reposition linked markers, Space+drag pan (06-03)
- ✓ AssetLinkDialog (Autocomplete search, createFilterOptions, onLink/onDiscard/onClose) + QuickCreateAssetForm (react-hook-form+zod, optional description/location) (06-04)
- Pending: MarkerEditPopup and full integration — Plan 06-05

**Phase 7 Calibration Accuracy:**
- Two-point calibration UX must prevent user errors (clicking non-straight features, wrong units)
- Need sanity validation to catch unrealistic scales (e.g., 1 pixel = 100 meters)

## Session Continuity

Last session: 2026-02-19 (plan 06-04 complete)
Stopped at: Plan 06-04 complete — AssetLinkDialog and QuickCreateAssetForm
Resume file: None
Next: Execute Plan 06-05 (MarkerEditPopup and full integration)

---
*State initialized: 2026-01-28*
*Last updated: 2026-02-18 (Plan 06-02 complete)*
