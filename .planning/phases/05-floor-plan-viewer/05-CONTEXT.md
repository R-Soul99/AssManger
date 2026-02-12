# Phase 5: Floor Plan Viewer - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive read-only viewer for displaying floor plans with pan/zoom controls and visualizing asset markers. Users can view, navigate, and filter markers. Marker placement/editing is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Viewer Interaction Patterns
- **Pan controls:** Drag to pan (primary) + arrow buttons in corners (alternative)
- **Zoom controls:** Support all three methods - mouse wheel scroll, zoom +/- buttons, and pinch gestures (touchpad/future touch)
- **Zoom behavior:** Continuous smooth zoom (no discrete levels)
- **Navigation feel:** Direct and immediate - no momentum/inertia, no animated easing. Pan/zoom stops exactly when user stops. Precise, CAD-like control.

### Marker Display & Clustering
- **Marker appearance:** Claude's discretion - choose between category icon+color, color dot+icon on hover, or icon only based on visibility/clarity
- **Overlapping markers:** Claude's discretion - implement clustering, stacking, or overlap based on performance and UX best practices
- **Performance strategy:** Load all markers, optimize later if needed. Ship faster, iterate based on real usage (defer viewport culling until proven necessary)
- **Marker size scaling:** Markers scale with zoom level (not fixed screen size). Grows/shrinks naturally with floor plan.

### Marker Popup & Navigation
- **Popup content:** Claude's discretion - choose appropriate info density (name/tag/category/status vs more detail vs minimal)
- **Navigation to details:** Claude's discretion - choose between clickable popup, explicit button, or double-click pattern
- **Popup positioning:** Claude's discretion - implement smart positioning logic (above marker by default, reposition near edges)
- **Popup dismissal:** Claude's discretion - consider user's desire for "pinnable" popups (ability to keep visible while panning) but implement what makes sense for v1 simplicity vs functionality trade-off

### Filtering & Visibility Controls
- **Filter UI layout:** Hybrid approach - quick filters in toolbar (always visible), detailed controls in collapsible sidebar when needed
- **Usage pattern:** Frequent toggling expected - controls must be easily accessible
- **Category visibility:** Individual show/hide toggles per category + "Show All" button for quick reset
- **Status filtering visual:** Dim non-matching markers to 30% opacity. Matching markers stay full brightness. Maintains context while focusing attention.

### Claude's Discretion
- Marker visual design (icon+color vs dots vs minimal)
- Clustering algorithm and threshold for overlapping markers
- Popup content density and layout
- Popup interaction patterns (click vs button vs double-click)
- Popup positioning logic
- Popup pinning behavior (implement if valuable for v1, defer if adds complexity)
- Exact toolbar and sidebar layout/styling
- Loading states and error handling
- Initial zoom level and bounds calculation

</decisions>

<specifics>
## Specific Ideas

- Direct and immediate navigation feel (not smooth/fluid like Google Maps) - user wants precision control like CAD software
- Hybrid toolbar + sidebar for filters reflects frequent adjustment use case
- Markers scaling with zoom (not fixed size) for natural feel when navigating
- Dim-not-hide approach for status filtering preserves spatial context

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope (viewing only, no marker editing)

</deferred>

---

*Phase: 05-floor-plan-viewer*
*Context gathered: 2026-02-12*
