# Phase 1: Foundation & Data Model - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the architectural foundation for the spatial planning interface. This phase delivers the database structure, coordinate system, and entity schemas that all spatial features will build upon. Users interact with this through project creation/opening workflows, while the normalized coordinates, repository pattern, and domain entities remain under the hood.

</domain>

<decisions>
## Implementation Decisions

### Database File Defaults
- **Cloud folder handling**: Warning dialog when user creates/opens database in cloud-synced folder (OneDrive/SharePoint)
  - Show risks (corruption, lock contention)
  - Let user proceed or cancel
  - Don't block entirely
- **Remember last path**: Yes, remember the last database location for next "Create New" operation
  - User creates multiple databases in same folder efficiently

### Project Management UX
- **Recent projects display**: Filename + last opened date/time
  - Not just filename (need to distinguish files with same name)
  - Not full path (clutters the UI)
  - Date/time helps find recent work
- **Recent count**: 5 projects maximum
  - Short list focused on most recent work
  - Balance between history and clutter
- **Missing file handling**: Prompt user to locate or remove when clicking missing recent project
  - Don't silently remove (user might know where it moved)
  - Don't just gray out (user can't act on it)
  - Give user agency to find it or clean up list
- **Open behavior**: Confirm if unsaved changes exist before opening another project
  - Warn user before losing work
  - Don't block multi-project use entirely (single window for v1)

### Migration & Schema Updates
- **Auto migrate**: Yes, run database schema migrations automatically on app start
  - Seamless updates, user doesn't see migration complexity
  - Fail gracefully with clear error if migration breaks
- **Backup before migrate**: Prompt user to backup database before running migrations
  - Don't force backup (trust in migrations)
  - Don't skip backup option (give user safety net)
  - Ask once per migration session

### Entity Flexibility
- **Custom fields support**: Yes, unlimited custom fields per entity
  - Assets, furniture, and infrastructure all support custom fields
  - No arbitrary limit (5, 10, etc) - let users add what they need
- **Field types**: Rich types (text, numbers, dates, dropdowns, checkboxes, links)
  - Not just simple strings
  - Support structured data for reporting/filtering
  - Dropdowns for consistency, checkboxes for boolean flags, links for related resources
- **Field configuration**: Per-asset-type custom field definitions
  - Each asset type (PC, Phone, Printer, Monitor, Electronics, Machinery) has its own custom field schema
  - PC type might have "Processor", "RAM", "OS"
  - Printer type might have "PPM", "Color/BW", "Network/USB"
  - Furniture and infrastructure follow same pattern (per furniture type, per infrastructure type)
- **Apply to all entities**: Yes, furniture and infrastructure also support custom fields with same flexibility as assets
  - Desk furniture might have "Material", "Capacity (people)", "Power outlets"
  - Power outlet infrastructure might have "Voltage", "Amperage", "Circuit ID"

### Claude's Discretion
- Default database location (suggest %LOCALAPPDATA%/AssManger or Documents/AssManger based on best practice)
- Database file extension (.db, .assetmap, .sqlite3 - pick most appropriate)
- Migration failure handling (rollback + error dialog vs partial apply + warn)
- Old version compatibility (refuse vs migrate vs read-only)
- Custom field storage implementation (JSON column, EAV table, or schema migrations for new fields)

</decisions>

<specifics>
## Specific Ideas

None - discussion stayed focused on behavior decisions rather than specific product references or UI mockups.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope. All questions focused on foundation architecture and project management behaviors, which are in Phase 1's requirements.

</deferred>

---

*Phase: 01-foundation-database-setup*
*Context gathered: 2026-02-21*
