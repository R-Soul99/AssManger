# Phase 1: Foundation & Database Setup - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish architectural foundations with normalized coordinates, repository abstraction, and database infrastructure. This phase creates the domain entities (Asset, FloorPlan, Marker, Location hierarchy, Calibration), implements repository interfaces for database abstraction, sets up SQLite with migration path to PostgreSQL, and implements project management (create/open database files with cloud sync detection).

</domain>

<decisions>
## Implementation Decisions

### Database file management
- **Default location**: %LOCALAPPDATA%\AssManger for new databases (safe from cloud sync)
- **Recent projects**: Remember 5 most recently opened databases
- **Error handling**: If database doesn't exist or is corrupted, show clear error message and remove from recent list
- **File extensions**: Use .assetmap as preferred extension, but also support opening .db and .sqlite files (save as .assetmap)

### Cloud sync warnings
- **Detection method**: Use both known path checking (OneDrive, Dropbox patterns) and filesystem attribute detection for comprehensive cloud folder detection
- **Warning emphasis**: Explain both the data corruption risk AND provide recommended alternative location (%LOCALAPPDATA%)
- **Warning persistence**: Warn once per session if user proceeds with cloud-synced location (don't nag every time but keep reminding)

### Coordinate system precision
- **Boundary handling**: Silently clamp coordinates to 0.0-1.0 range if slightly outside (e.g., -0.001 becomes 0.0)
- **Pixel transformation**: Round to nearest integer pixel when converting normalized coordinates to pixels for rendering
- **Validation timing**: Allow temporarily invalid coordinates during drag interactions, validate on save/release (relaxed during interactions)

### Entity validation rules
- **Required fields for assets**: Asset tag, location, category, and description are all required
- **Asset tag uniqueness**: Warn if tag already exists in database with explanation and suggestion to avoid duplicates (soft validation, not hard constraint)
- **Hierarchical deletion**: Cascade delete with confirmation dialog showing impact (e.g., "This will delete 3 floors, 12 rooms, and 45 assets"), plus create silent backup snapshot for potential restoration
- **Validation timing**: Show validation errors immediately as user types (real-time feedback)

### Claude's Discretion
- Decimal precision for normalized coordinates (choose appropriate precision based on accuracy needs vs storage efficiency)
- Warning timing for cloud sync detection (decide whether to block before opening or warn with proceed option)
- Exact wording and UI layout for warning dialogs
- Backup snapshot storage location and retention policy
- Implementation details of repository pattern and database migration infrastructure

</decisions>

<specifics>
## Specific Ideas

- Research flagged that normalized coordinates (0.0-1.0 range) are critical architectural decision that's expensive to change later - must be correct from day one
- Research identified SQLite corruption in cloud folders as critical risk - detection and warnings are essential for data safety
- Repository abstraction layer enables future SQLite → PostgreSQL migration without touching business logic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-database-setup*
*Context gathered: 2026-01-28*
