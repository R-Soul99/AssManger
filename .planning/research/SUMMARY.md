# Project Research Summary

**Project:** AssManger - Visual Asset Management with Interactive Floor Plan Mapping
**Domain:** Desktop Asset Management & Spatial Visualization
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

AssManger is a visual asset management system that combines traditional inventory tracking with interactive floor plan mapping. Research shows this domain is best served by a desktop-first approach using Tauri for native performance, React + Konva.js for interactive canvas rendering, and SQLite with a clear PostgreSQL migration path for scaling from single-user to multi-user deployment. The core challenge is managing spatial data (equipment markers on floor plans) while maintaining resolution independence and accurate real-world measurements through user-calibrated scale systems.

The recommended approach is to start with a single-user desktop application focused on the core spatial mapping features (import floor plan, calibrate scale, place markers, link to asset inventory) before adding collaborative or cloud features. This validates the unique value proposition (visual equipment location) early, establishes the coordinate system foundation correctly from day one, and avoids the critical pitfalls of SQLite corruption in cloud-synced folders and pixel-based coordinates that break across resolutions.

Key risks include canvas performance degradation with large marker counts (500+), inaccurate scale calibration leading to systematic measurement errors, and CSV round-trip data corruption through Excel. These can be mitigated through viewport culling and layer separation for rendering, validation and visual feedback for calibration, and UTF-8 BOM encoding with field quoting for CSV exports. The architecture must use normalized coordinates (0.0-1.0 range) for all spatial data and repository abstraction for database independence.

## Key Findings

### Recommended Stack

**Desktop-First with Tauri:** Tauri provides 10x faster startup (0.4s vs 1.5s), 85% smaller bundles (under 10MB vs 100-300MB), and 20-40MB RAM usage compared to Electron's 250MB+. Uses Windows' native Edge WebView2, making it ideal for Windows-primary deployment. The Rust backend adds security through explicit API permissions and provides excellent file system access for floor plan image management.

**Core technologies:**
- **Tauri 2.1+**: Desktop framework — native performance, small footprint, uses system WebView, 35% YoY adoption growth in 2026
- **React 19 + TypeScript 5.9+**: UI library — industry standard with mature ecosystem, excellent type safety, React Server Components support
- **Konva.js 9.x**: Canvas library — high-performance 2D rendering with scene graph, dirty region detection, built-in event handling for interactive floor plans
- **SQLite + Drizzle ORM**: Database — single-file embedded database perfect for v1, 100x faster than Prisma, seamless PostgreSQL migration path
- **Zustand + TanStack Query**: State management — lightweight client state (3KB) + server/file state caching, 80% market adoption in new React apps
- **shadcn/ui + Tailwind CSS**: UI framework — accessible, themeable components with full control, rapid styling without CSS files

**Key version requirements:**
- React 19.2.4 requires TypeScript 5.9+ and @types/react 19.2.8+
- Tauri 2.x requires Rust 1.70+ toolchain
- Drizzle ORM 0.36+ with better-sqlite3 11.x for TypeScript 5.9 compatibility

### Expected Features

**Must have (table stakes):**
- **Asset Inventory CRUD** — create, read, update, delete assets with searchable list; all asset management tools provide this baseline
- **Hierarchical Location Structure** — Site > Building > Floor > Room organization; standard for facility management workflows
- **Import Floor Plan Image** — upload PNG/JPG floor plans as spatial canvas; users have existing CAD/PDF exports to leverage
- **Scale Calibration** — two-point calibration for real-world measurements; required for distance measurement accuracy
- **Place Equipment Markers** — click to place, drag to reposition, link to asset records; core visual location tracking feature
- **Asset Search/Filter** — multi-field search (name, type, location, custom fields); expected for navigating asset lists
- **CSV Export** — universal data exchange format for facilities managers working in Excel
- **Pan and Zoom** — navigate large floor plans with standard viewport controls
- **Distance Measurement Tool** — point-to-point measurement using calibrated scale

**Should have (competitive advantages):**
- **CSV Import** — bulk import existing inventory from Excel (trigger: users need data migration)
- **Visual Search on Floor Plan** — filter assets and highlight markers on floor plan ("show me all MRI machines")
- **Mobile-Optimized View** — touch-friendly controls for field technicians using tablets
- **Asset Status Tracking** — visual badges for maintenance due, out of service states
- **Photo Attachments** — visual documentation of equipment condition
- **Multiple Floor Plans** — support multi-floor buildings with floor selector
- **Print/Export Floor Plan View** — generate PDF of floor plan with asset markers for stakeholder sharing

**Defer (v2+):**
- **Preventive Maintenance Scheduling** — complex workflow, defer until maintenance tracking proves critical
- **Work Order Management** — full CMMS functionality, defer until location tracking validated
- **Advanced Analytics/Reporting** — defer until users request more than CSV export capabilities
- **3D Floor Visualization** — high complexity, defer until multi-floor use case validated
- **Offline-First Architecture** — significant complexity, defer until field connectivity issues proven
- **QR Code Scanning** — defer until mobile check-in/out workflow established
- **BMS/IoT Integration** — enterprise feature, defer until customers with building management systems emerge

### Architecture Approach

**Layered architecture with repository abstraction:** The system uses a four-layer architecture (Presentation, Application/Service, Domain, Infrastructure) to ensure clean separation of concerns and enable database migration from SQLite to PostgreSQL without touching business logic. The repository pattern with interface abstraction is critical for this domain's scaling path from single-user to multi-user deployment.

**Major components:**
1. **Normalized Coordinate System** — stores marker positions as 0.0-1.0 coordinates relative to image dimensions, converts to pixels only during rendering; ensures resolution independence across devices and image resizes
2. **Calibration-Based Measurement Service** — stores known real-world distance between two points, calculates pixels-per-unit ratio, transforms normalized coordinates to real-world measurements
3. **Repository Abstraction Layer** — IAssetRepository, IFloorPlanRepository, IFileStorageRepository interfaces with SQLite and PostgreSQL implementations; enables clean database migration
4. **Multi-Layer Canvas Rendering** — separates static (floor plan background) from dynamic (markers) layers; implements viewport culling and dirty flag patterns for performance
5. **File Storage Abstraction** — supports local filesystem for v1, cloud object storage (S3/Azure Blob) for v2+; stores relative paths/keys instead of absolute paths

**Key architectural decisions:**
- Use normalized coordinates (0.0-1.0) from day one — pixel coordinates cannot be migrated cleanly
- Implement repository interfaces before concrete implementations — prevents SQLite lock-in
- Separate canvas layers early — performance optimization is painful to retrofit
- Store image keys/relative paths, not absolute paths — enables storage migration

### Critical Pitfalls

1. **SQLite Database Corruption in Cloud-Synced Folders** — NEVER store active SQLite databases in OneDrive/SharePoint/Dropbox folders; page-level locking doesn't work over network file systems, causing lock contention and data corruption. Store in %LOCALAPPDATA% instead of %USERPROFILE%\OneDrive. Detect cloud sync paths programmatically and warn users during setup.

2. **Canvas Performance Degradation with Large Marker Sets** — naive canvas implementations redraw all markers on every pan/zoom, causing UI lag with 500+ markers. Implement viewport culling (only render visible markers), use multiple canvas layers (static background, dynamic markers), apply dirty flag patterns, batch rendering operations. Use R-Tree spatial indexing for fast marker lookup by bounding box.

3. **Inaccurate Two-Point Scale Calibration** — users clicking non-straight features, entering wrong units, or accepting unrealistic scales leads to systematic measurement errors throughout application. Provide clear visual guidance ("Select two points along a straight wall"), show real-time calculation as user enters measurement, implement sanity checks (warn if scale suggests 1 pixel = 100 meters), display calibration result prominently and require confirmation.

4. **CSV Round-Trip Data Corruption Through Excel** — Excel auto-formats data (leading zeros disappear, dates misinterpreted, UTF-8 corruption without BOM). Export CSV with UTF-8 BOM to ensure Excel recognizes encoding, quote all fields consistently, provide user guidance to use "Get Data / Import" feature not double-click. Validate CSV on import with encoding detection, delimiter detection, and preview before final import.

5. **Pixel-Based Coordinates Failing Across Zoom Levels** — storing marker positions as absolute pixel coordinates breaks when images resize, zoom changes, or display at different resolutions. Use normalized coordinates (0.0-1.0 range) for marker storage from day one, transform to pixels only during rendering. Migration from pixel to normalized coordinates is painful with existing data.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Data Model
**Rationale:** Must establish coordinate system, database architecture, and storage patterns correctly from day one; these decisions are extremely expensive to change later and affect every subsequent phase.

**Delivers:**
- Domain entities (Asset, FloorPlan, Marker, Location, Calibration) with validation
- Repository interfaces (IAssetRepository, IFloorPlanRepository, IMarkerRepository, IFileStorageRepository)
- SQLite repository implementations
- Database migrations system
- Normalized coordinate transformation service
- Local file storage for floor plan images

**Addresses:**
- Avoids Pitfall #5 (pixel coordinates) by implementing normalized coordinates from start
- Avoids Pitfall #6 (poor database abstraction) by defining repository interfaces early
- Avoids Pitfall #7 (broken file paths) by using database-relative paths

**Architecture components:** Repository pattern, normalized coordinate system, file storage abstraction

**Research flag:** STANDARD PATTERNS — well-documented repository and coordinate transformation patterns; skip phase research

### Phase 2: Asset Management (Non-Spatial)
**Rationale:** Delivers immediate value with traditional CRUD functionality, tests repository layer before adding complex spatial features, establishes UI patterns and validation rules that will be reused for spatial editing.

**Delivers:**
- Asset service layer (create, read, update, delete)
- Asset UI components (list, form, detail view)
- Location hierarchy management (Site > Building > Floor > Room)
- Asset search and filter functionality
- CSV export with UTF-8 BOM encoding

**Addresses:**
- FEATURES.md table stakes: Asset Inventory CRUD, Hierarchical Locations, Asset Search/Filter, CSV Export
- Pitfall #8 (incomplete asset tracking) through required fields and validation
- Pitfall #4 (CSV corruption) through proper encoding and field quoting

**Uses:** Zustand for client state, TanStack Query for database queries, React Hook Form for asset forms, Zod for validation, shadcn/ui components

**Research flag:** STANDARD PATTERNS — basic CRUD operations well-documented; skip phase research

### Phase 3: Floor Plan Viewer (Read-Only)
**Rationale:** Establishes canvas rendering foundation and tests normalized coordinate system before adding interactive editing; provides visual feedback for spatial system validation.

**Delivers:**
- Floor plan image upload and storage
- Image viewer component with pan/zoom controls (react-zoom-pan-pinch)
- Konva.js canvas integration with multi-layer rendering
- Display existing markers on floor plans (read-only)
- Viewport culling for performance with large marker sets

**Addresses:**
- FEATURES.md table stakes: Import Floor Plan Image, Pan and Zoom
- Pitfall #2 (canvas performance) through layer separation and viewport culling
- Tests normalized coordinate display logic before adding editing

**Uses:** Konva.js for canvas rendering, CoordinateTransformService for normalized-to-pixel conversion, IFileStorageRepository for image loading

**Research flag:** MODERATE RESEARCH NEEDED — Konva.js layer architecture and viewport culling patterns need exploration; consider targeted research during planning

### Phase 4: Marker Management (Interactive Spatial)
**Rationale:** Builds on viewer to add core spatial editing functionality; completes the unique value proposition (visual equipment location tracking).

**Delivers:**
- Click-to-place marker functionality
- Marker CRUD operations (create, edit, delete, move)
- Link markers to asset records
- Marker editing UI (drag to reposition, delete, update)
- Asset marker icons/colors for visual distinction

**Addresses:**
- FEATURES.md table stakes: Place Equipment Markers, Asset Marker Icons
- FEATURES.md competitive: Visual Search on Floor Plan
- Completes core spatial feature set

**Uses:** Konva.js event handling (click, drag, transform), Marker repository, Asset-Marker linking service

**Research flag:** STANDARD PATTERNS — marker placement and drag-drop well-documented in Konva.js docs; skip phase research

### Phase 5: Calibration & Measurement
**Rationale:** Enables real-world measurements after core spatial features working; nice-to-have feature that doesn't block other work.

**Delivers:**
- Two-point calibration tool UI
- Calibration validation (minimum distance checks, sanity validation)
- MeasurementService for real-world distance calculations
- Distance measurement tool (point-to-point)
- Visual feedback: scale display on floor plans, calibration preview

**Addresses:**
- FEATURES.md table stakes: Scale Calibration, Distance Measurement Tool
- Pitfall #3 (inaccurate calibration) through validation, visual feedback, and clear guidance
- Enables accurate measurements for facility management workflows

**Uses:** Calibration entity with validation, MeasurementService, CoordinateTransformService

**Research flag:** LIGHT RESEARCH NEEDED — two-point calibration UX patterns and validation thresholds worth exploring; consider targeted research if time permits

### Phase 6: Data Quality & Validation
**Rationale:** Addresses data integrity issues after core features complete; improves user experience and data reliability.

**Delivers:**
- CSV import with encoding detection and preview
- Import validation and error reporting
- Data quality dashboard (profile completeness tracking)
- Bulk update capabilities
- Asset history/changelog tracking

**Addresses:**
- FEATURES.md should-have: CSV Import
- Pitfall #4 (CSV corruption) through import validation
- Pitfall #8 (incomplete asset data) through quality tracking
- Completes round-trip data workflow

**Research flag:** STANDARD PATTERNS — CSV parsing and validation well-documented; skip phase research

### Phase 7: Multi-User & Cloud Migration (Future)
**Rationale:** Only needed when scaling beyond single user; repository abstraction makes this straightforward when triggered by user demand.

**Delivers:**
- PostgreSQL repository implementations
- Cloud object storage implementation (S3/Azure Blob)
- Database migration scripts and tooling
- User authentication and basic roles
- Multi-device sync capabilities

**Addresses:**
- FEATURES.MD should-have: Multi-User with Basic Roles, Cloud Storage Sync
- Pitfall #1 (SQLite corruption) becomes non-issue with centralized database
- Pitfall #6 (poor abstraction) payoff — clean migration due to repository pattern
- Scales to 100+ concurrent users

**Uses:** PostgresAssetRepository, CloudObjectStorage, authentication middleware

**Research flag:** DEEP RESEARCH NEEDED — PostgreSQL migration strategy, cloud storage patterns, authentication integration; requires targeted research during phase planning

### Phase Ordering Rationale

- **Phase 1 before all others:** Coordinate system and database architecture are foundational; changing later requires migrating all data and rewriting large portions of codebase
- **Phase 2 before Phase 3:** Tests repository layer and establishes UI patterns with simpler CRUD before adding canvas complexity
- **Phase 3 before Phase 4:** Read-only viewer validates rendering and coordinate system before adding interactive editing
- **Phase 4 after Phase 3:** Marker editing builds directly on viewer foundation; cannot place markers without floor plan display
- **Phase 5 after Phase 4:** Calibration enables measurements but isn't required for basic marker placement; can be deferred if time-constrained
- **Phase 6 after Phase 2:** CSV import requires asset management foundation; data quality tracking requires baseline features complete
- **Phase 7 last:** Multi-user only needed when scaling; architecture supports this but defer until single-user validated

**Critical dependencies from research:**
- Normalized coordinates (Phase 1) required by all spatial features (Phases 3-5)
- Repository abstraction (Phase 1) enables database migration (Phase 7) without business logic changes
- Floor plan viewer (Phase 3) required by marker management (Phase 4)
- Scale calibration (Phase 5) required by measurement tools

**Pitfall avoidance through ordering:**
- Phase 1 prevents Pitfalls #5, #6, #7 through correct architectural foundations
- Phase 2-3 ordering prevents premature optimization — establishes performance patterns before scaling
- Phase 7 deferred until needed — avoids premature cloud complexity

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Floor Plan Viewer):** Konva.js layer architecture, viewport culling algorithms, performance optimization patterns for large canvas rendering; recommend targeted research on canvas optimization best practices
- **Phase 5 (Calibration & Measurement):** Two-point calibration UX patterns, validation threshold recommendations, error messaging strategies; light research on calibration UI/UX if time permits
- **Phase 7 (Multi-User & Cloud):** SQLite-to-PostgreSQL migration tooling and strategies, data consistency during migration, cloud storage cost optimization, authentication patterns; requires deep research during phase planning

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Repository pattern, normalized coordinate transformation well-documented in architecture research and TypeScript patterns
- **Phase 2 (Asset Management):** Standard CRUD operations, React form handling, CSV export libraries well-established
- **Phase 4 (Marker Management):** Konva.js drag-drop and event handling well-documented in official docs
- **Phase 6 (Data Quality):** CSV parsing, validation patterns, data quality metrics are standard practices

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against 2026 official documentation, version compatibility confirmed, Tauri adoption trajectory validated through multiple sources |
| Features | HIGH | Feature landscape based on competitor analysis (FMX, AkitaBox, MaintainX), NHS/healthcare requirements, facility management best practices from multiple industry sources |
| Architecture | HIGH | Architecture patterns validated against established asset management systems (IBM Maximo, Archilogic), indoor mapping platforms (Mappedin), repository pattern best practices |
| Pitfalls | HIGH | All critical pitfalls confirmed through multiple sources (SQLite corruption: GitHub issues + official docs, canvas performance: AG-Grid + MDN, CSV corruption: multiple developer blogs) |

**Overall confidence:** HIGH

Research draws from official documentation (React, TypeScript, Tauri, Konva.js, SQLite), established industry platforms (IBM Maximo, Archilogic, Mappedin), real-world issue reports (GitHub issues on SQLite corruption), and performance benchmarks (canvas rendering optimization, ORM comparisons). All major technical decisions supported by multiple independent sources.

### Gaps to Address

**Performance thresholds:** Research identifies that canvas performance degrades at "500+ markers" but specific threshold depends on marker complexity, device capabilities, and rendering optimizations implemented. Recommend performance testing during Phase 3 to establish actual limits for target hardware (Windows workstations vs tablets).

**Calibration accuracy requirements:** Two-point calibration research shows systematic errors possible, but acceptable error margin depends on use case (equipment placement: ±10cm acceptable; regulatory compliance: ±1cm required). Validate accuracy requirements with target users during Phase 5 planning.

**Multi-user scaling limits:** Research suggests SQLite handles 5-10 concurrent writers before PostgreSQL migration needed, but actual limit depends on write patterns and transaction design. Monitor during early multi-user deployments to identify migration trigger.

**Cloud storage cost modeling:** Cloud migration (Phase 7) cost depends on image count, size, access patterns, and retention requirements. Estimate storage and bandwidth costs during Phase 7 planning based on actual usage data from Phases 1-6.

**Mobile optimization priorities:** Research suggests mobile-optimized view is competitive advantage but unclear which features most valuable on mobile (read-only floor plan viewing vs full editing). Validate mobile workflows with field technicians before committing development effort.

## Sources

### Stack Research (HIGH confidence)
- Tauri vs Electron performance comparisons: Tibicle, RaftLabs, Hopp benchmarks
- React 19 + TypeScript 5.9: Official React docs, TypeScript release notes, npm registry
- Konva.js vs Fabric.js: Medium technical comparison, DEV Community benchmarks
- Drizzle vs Prisma: Multiple 2026 ORM comparisons showing 100x SQLite performance advantage
- State management: Zustand vs Redux 2026 market analysis, TanStack Query ecosystem guide

### Feature Research (HIGH confidence)
- Asset management domain: FMX blog, Limble, RedBeam facility management guides
- Floor plan tools: FMX Interactive Mapping, MapPlug, Fieldwire measurement docs
- Competitor analysis: Accruent, Coast facility management software reviews
- NHS requirements: NHS England medical equipment guidance, NHS Fife policies
- Hierarchy patterns: Asset Optics facilities hierarchy documentation

### Architecture Research (HIGH confidence)
- Asset management systems: IBM Maximo Spatial, Archilogic floor plan SDK, Prevu3D
- Indoor mapping: Mappedin asset tracking, Geospatial World asset management
- Coordinate systems: Scratchapixel pixel coordinates, ZBigatron camera-to-floorplan mapping
- Repository pattern: Medium layered architecture guides, GitHub TypeScript clean architecture
- Database migration: Render SQLite-to-PostgreSQL guide, Bytebase migration documentation

### Pitfall Research (HIGH confidence)
- SQLite corruption: GitHub OneDrive issues (#54, #688), Microsoft Q&A, sqlite.org official corruption guide
- Canvas performance: AG-Grid optimization guide, MDN canvas optimization docs, ChairNerd high-performance maps
- Asset management challenges: EZO, Infraon, Revnue poor asset management consequences
- CSV corruption: Row Zero CSV errors guide, POWER CSV Excel corruption analysis
- Calibration accuracy: FGDC geospatial positioning standards, MDPI cadastral accuracy studies
- Database concurrency: Shadecoder database locking guide, AkashSDas concurrency control

### Primary Sources Referenced
- Official documentation: React 19, TypeScript 5.9, Tauri 2.x, Konva.js, SQLite, Drizzle ORM
- Industry platforms: IBM Maximo, Archilogic, Mappedin, FMX, AkitaBox, MaintainX
- Standards bodies: FGDC spatial accuracy standards, NHS medical equipment policies
- GitHub repositories: OneDrive SQLite issues, TypeScript clean architecture examples
- Performance benchmarks: AG-Grid canvas rendering, Google Maps million-marker optimization

---
*Research completed: 2026-01-28*
*Ready for roadmap: YES*
