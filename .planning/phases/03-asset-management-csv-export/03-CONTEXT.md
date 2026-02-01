# Phase 3: Asset Management & CSV Export - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete asset inventory management with CRUD operations, multi-dimensional filtering (site/building/floor/room, category, status), search (asset tag, description, serial, phone), sortable columns, detail views, and Excel-compatible CSV export for assets, locations, and categories.

</domain>

<decisions>
## Implementation Decisions

### Asset List Display & Interaction
- **Layout:** Data table (MUI DataGrid/Table) with sortable columns
- **Columns:** Configurable - user can show/hide columns for customized views
- **Row Actions:** Claude's discretion on pattern (click row for detail, action menu, or expandable rows)
- **Bulk Operations:** YES - checkboxes for multi-select, support bulk delete and bulk export

### Filtering & Search Experience
- **Filter UI:** Claude's discretion on layout (top bar, sidebar, or chips)
- **Search Behavior:** Debounced live search (300-500ms delay after typing stops before filtering)
- **Search Fields:** Claude's discretion on scope (spec'd fields only vs including category/location names)
- **Filter Combination Logic:** Claude's discretion on AND/OR behavior between filters

### Asset Detail & Editing Workflow
- **Detail View Structure:** Side panel/drawer that slides from right (keeps list visible for quick multi-asset viewing)
- **Edit Mode:** Always editable inline (fields editable by default in detail panel)
- **Validation & Unsaved Changes:** Inline validation errors under fields + dirty indicator (asterisk/badge) + confirm dialog on close if unsaved
- **Detail Content:** Show editable fields + metadata (Created/Updated timestamps) + linked floor plan markers section (list/map of where asset appears)

### CSV Export Options & Behavior
- **Export Scope:** Ask each time - dialog prompts "Export 47 filtered assets or all 523 assets?" (clear user choice)
- **Field Selection:** Claude's discretion (all fields, column visibility respect, or chooser dialog)
- **File Naming:** Claude's discretion (descriptive with timestamp, simple generic, or user prompt)
- **Post-Export Action:** Open containing folder (show file in File Explorer for immediate Excel opening)

### Claude's Discretion
Areas where implementation choice is delegated:
- Row interaction pattern (click, expand, buttons)
- Filter UI positioning and layout
- Search field scope (spec'd only vs expanded)
- Filter combination logic (AND vs smart combination)
- CSV field selection mechanism
- CSV file naming convention

</decisions>

<specifics>
## Specific Ideas

- Configurable columns are important for flexibility - different users may prioritize different fields
- Side panel detail view keeps workflow efficient - can quickly browse multiple assets without losing list context
- Always-editable inline fields for fast data entry - common in asset management workflows
- "Ask each time" on CSV export prevents accidental full-dataset exports vs filtered exports
- Opening folder after export supports immediate Excel workflow

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 03-asset-management-csv-export*
*Context gathered: 2026-02-01*
