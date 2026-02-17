# Phase 6: Marker Management - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Add spatial editing capabilities to the existing floor plan viewer: place markers on floor plans, link them to assets, reposition markers via drag, and delete markers. This phase extends the viewer built in Phase 5 with a write layer. Calibration and measurement are Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Edit Mode Entry
- Explicit "Edit Markers" toggle button in the existing viewer toolbar (alongside back button and floor plan name)
- The button shows as active/highlighted when in edit mode
- Cursor changes to a crosshair over the canvas when in edit mode
- Markers are only draggable in edit mode (locked in view mode)
- Click behavior when in edit mode (existing marker vs empty space): Claude's Discretion

### Marker Placement Flow
- Clicking empty canvas in edit mode places an unlinked placeholder marker immediately at that position
- The placeholder marker is visually distinct from linked markers: Claude's Discretion on exact styling
- To link, user clicks the placeholder and a UI appears to search/select an existing asset
- Asset search/link UI: Claude's Discretion (most practical for desktop — likely a searchable combobox or compact dialog)
- "Create new asset" option available from the link UI — opens a quick-create form with only required fields (asset tag, category); full details can be filled later from the asset list

### Drag vs Pan Conflict
- In edit mode, normal drag on a marker moves it (repositioning)
- In edit mode, holding Space + drag pans the map (Figma/Photoshop pattern)
- Small activation distance (~6px) before a marker drag starts — prevents accidental repositioning when clicking to link/edit
- Undo (Ctrl+Z) for marker moves: Claude's Discretion based on implementation complexity

### Marker Deletion & Editing
- Clicking a linked marker in edit mode: Claude's Discretion (likely edit popup extending the existing view-mode popup with edit/delete actions)
- Delete confirmation: Claude's Discretion (consider that accidental deletes are recoverable only by re-placing)
- Re-linking (swapping the asset a marker points to): Claude's Discretion on whether to support it or require delete-and-replace
- Marker count display:
  - Floor plan card in list view → total marker count badge
  - Viewer toolbar → filtered marker count (respecting active category/status filters)

### Claude's Discretion
- Exact visual styling of unlinked placeholder markers
- Smart click detection in edit mode (click marker vs click empty space)
- Asset linking UI (combobox vs compact dialog)
- Edit popup design for linked markers in edit mode
- Delete confirmation approach
- Re-linking support decision
- Undo behavior for marker repositioning

</decisions>

<specifics>
## Specific Ideas

- The Space + drag pattern for panning in edit mode is intentional — matches Figma/Photoshop muscle memory
- Quick-create asset form should only require the minimum fields to get a marker placed fast; the user can flesh out full asset details later from the asset management screen
- Marker count in the viewer toolbar should reflect current filter state (not just total)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-marker-management*
*Context gathered: 2026-02-17*
