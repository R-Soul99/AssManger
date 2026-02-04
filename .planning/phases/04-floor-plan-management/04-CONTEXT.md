# Phase 4: Floor Plan Management - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can import floor plan images, assign them to building/floor locations, view and manage floor plans in a card-based list, edit metadata, reorder plans within a floor, and delete plans (with marker-exists warnings). Marker placement and the interactive floor plan viewer are separate phases (5 and 6).

</domain>

<decisions>
## Implementation Decisions

### List layout
- Card-based layout — each card shows: image thumbnail, location path (e.g. HQ > Main Building > Ground Floor), plan name, and asset/marker count
- Clicking a card opens a detail/edit view (full page or routed view, not a drawer)
- Hierarchy navigation approach: Claude's discretion — pick grouped sections or filter sidebar based on existing app patterns

### Import workflow
- Location (building/floor) is assigned **after** import — image saves first with a placeholder, user edits afterward
- Accepted formats: PNG, JPEG, PDF, BMP, TIF
  - **Note for researcher:** PDF import requires rasterization (page → image). BMP and TIF may need conversion. Investigate what's feasible in a Tauri desktop context without heavy native dependencies.
- Large or unsupported images should be **auto-resized/converted** rather than rejected
- Single vs multi-file import: Claude's discretion — pick based on typical workflow simplicity

### Multi-plan naming
- Free-text name (no predefined zone types or dropdowns)
- Name is **optional** — defaults to the source filename if left blank
- User can **drag to reorder** floor plans within the same floor (custom display order)
- Floor plan duplication (copy image + metadata): Claude's discretion — add if trivial, skip if it adds complexity

### Deletion safety
- Deleting a plan that has markers: **warn and confirm** dialog (not blocked)
- Warning message is generic: "This floor plan has assets placed on it. Deleting will remove them."
- **Bulk delete** is available (consistent with asset list bulk-action pattern)
- When bulk deleting plans with markers: **per-plan warnings** — dialog steps through each affected plan individually before proceeding

### Claude's Discretion
- Hierarchy navigation pattern (grouped sections vs filter sidebar) — match existing app navigation style
- Single vs multi-file import — pick the simpler approach
- Whether to support floor plan duplication — add only if trivial

</decisions>

<specifics>
## Specific Ideas

- User explicitly requested broad format support: PNG, JPEG, PDF, BMP, TIF. PDF rasterization is the highest-complexity item here — researcher should evaluate feasibility and fallback options.
- Per-plan deletion warnings (stepping through each plan) rather than a single combined warning — user prefers granular confirmation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-floor-plan-management*
*Context gathered: 2026-02-04*
