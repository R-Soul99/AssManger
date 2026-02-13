# Phase 5: Floor Plan Viewer - Research

**Phase Goal**: Users can view floor plans with interactive pan/zoom, see all placed markers with category styling, and filter/toggle marker visibility.

**Research Date**: 2026-02-12

## 1. Canvas vs SVG for Marker Rendering

### Decision: Use HTML5 Canvas

**Performance Evidence:**
- Canvas maintains 60 FPS when handling thousands of objects, far exceeding the 500+ marker requirement
- SVG performance degrades significantly with high element counts due to DOM overhead
- Real-world case study: Felt mapping application switched from SVG+React to Canvas specifically because "asking React to create, diff, reconcile and update thousands of elements on every move of the mouse when panning or zooming the map gets slow"
- Canvas is the superior choice for dynamic rendering without DOM manipulation

**Trade-offs:**
- Canvas requires manual event handling and hit detection (not automatic like SVG)
- Canvas needs explicit redraw logic when state changes
- SVG integrates seamlessly with React component model, but this advantage is lost with 500+ elements

**Sources:**
- [SVG vs Canvas Animation: Best Choice for Modern Frontends](https://www.augustinfotech.com/blogs/svg-vs-canvas-animation-what-modern-frontends-should-use-in-2026/)
- [From SVG to Canvas – part 1: making Felt faster](https://felt.com/blog/from-svg-to-canvas-part-1-making-felt-faster)
- [SVG vs Canvas: Choosing the Right Tool for Your Graphics](https://medium.com/@kedari.mahesh/svg-vs-canvas-choosing-the-right-tool-for-your-graphics-bd584a22e3c0)

## 2. Pan/Zoom Library Selection

### Recommended: react-zoom-pan-pinch

**Key Features:**
- Lightning-fast performance with zero external dependencies
- Supports mobile gestures, touchpad gestures, and desktop mouse events
- Provides both controlled and uncontrolled component patterns
- Built-in transformation state management
- 3.7kb gzipped footprint

**Alternative Options:**
1. **@flowscape-ui/canvas-react** - High-performance infinite canvas with nodes, selection, history
   - More features than needed (nodes, selection, history)
   - Good for complex canvas applications

2. **panzoom** - Lightweight vanilla JS library (~3.7kb)
   - Uses CSS transforms for GPU acceleration
   - Could wrap with custom React hook
   - More manual state management required

3. **Custom Canvas Implementation** - Full control but more complexity
   - Would need to implement: wheel event handling, drag tracking, touch gesture detection, transform matrix math
   - Per 05-CONTEXT.md: "Direct and immediate navigation feel (not smooth/fluid like Google Maps)"
   - May need custom implementation to achieve precise CAD-like feel without momentum/inertia

**Decision**: Start with react-zoom-pan-pinch configured for no animations/momentum. If CAD-like precision requirements aren't met, implement custom transform logic.

**Sources:**
- [Unlock Interactive UI: Master Zoom, Pan, and Pinch in React](https://www.somethingsblog.com/2025/05/27/unlock-interactive-ui-master-zoom-pan-and-pinch-in-react/)
- [react-laag | Hooks for positioning tooltips & popovers](https://www.react-laag.com/)
- [GitHub - timmywil/panzoom](https://github.com/timmywil/panzoom)

## 3. Viewport Culling Strategy

### Recommended: Quadtree Spatial Index

**Performance Benefits:**
- 4-10x faster preparation phase compared to rendering all markers
- Enables efficient spatial queries: "which markers are in the current viewport?"
- Recursively divides 2D space into four quadrants for rapid boundary queries
- Only render markers visible in current viewport bounds

**Implementation Approach:**
1. Build Quadtree on marker load/update
2. Query tree with viewport bounds on pan/zoom
3. Only render markers returned from query
4. Update tree incrementally when markers added/removed

**Alternative: R-tree**
- Better for non-point geometries (rectangles, polygons)
- More complex implementation
- Overkill for point markers

**05-CONTEXT.md Decision**: "Load all markers, optimize later if needed. Ship faster, iterate based on real usage (defer viewport culling until proven necessary)"

**Implementation Plan**:
- Phase 5: Render all markers (simple, fast to implement)
- If performance issues arise: Add Quadtree viewport culling
- Spatial index can be added without changing marker data structure

**Sources:**
- [Lesson 8 - Optimize performance | An infinite canvas tutorial](https://infinitecanvas.cc/guide/lesson-008)
- [Optimizing Leaflet Performance with a Large Number of Markers](https://medium.com/@silvajohnny777/optimizing-leaflet-performance-with-a-large-number-of-markers-0dea18c2ec99)
- [HTML5 Canvas Performance and Optimization Tips](https://gist.github.com/jaredwilli/5469626)

## 4. Marker Popup Positioning

### Recommended: Popper.js with preventOverflow

**Industry Standard:**
- Popper.js is the de facto standard for tooltip/popover positioning in modern web applications
- Used by React-Bootstrap, Material-UI, and many other component libraries
- Handles edge detection and smart repositioning automatically

**preventOverflow Modifier:**
- Automatically detects when popup would be cut off by viewport edges
- Repositions popup to stay within boundary area
- Configurable padding and boundary element

**React Integration Options:**
1. **react-laag** - React hooks wrapper around positioning logic
   - Recognizes cutoff and flips position automatically
   - Handles both fixed and absolute positioning

2. **React-Bootstrap Overlay** - Wrapper around Popper.js
   - Adds transition support and visibility toggling
   - Heavier dependency if not already using React-Bootstrap

3. **Direct Popper.js** - Lightweight, manual integration
   - More control, less abstraction
   - ~2-3kb gzipped

**05-CONTEXT.md Decision**: "Popup positioning: Claude's discretion - implement smart positioning logic (above marker by default, reposition near edges)"

**Recommended**: Use react-laag for clean React integration without heavyweight UI library dependency.

**Sources:**
- [Popper - Tooltip & Popover Positioning Engine](https://popperjs.bootcss.com/)
- [Prevent Overflow | Popper](https://popper.js.org/docs/v2/modifiers/prevent-overflow/)
- [Introducing react-laag v2: tooltip & popover positioning in React](https://erikverweij.medium.com/introducing-react-laag-v2-tooltip-popover-positioning-in-react-7fa9697e60ff)

## 5. Direct/Immediate Navigation Feel

### Requirement from 05-CONTEXT.md:
"Direct and immediate navigation feel (not smooth/fluid like Google Maps) - user wants precision control like CAD software"
"Pan/zoom stops exactly when user stops. Precise, CAD-like control."

### Implementation Strategy:

**Disable Animations:**
- No momentum/inertia on pan or zoom
- No easing transitions
- Transform updates synchronously with input events

**react-zoom-pan-pinch Configuration:**
```typescript
<TransformWrapper
  panning={{ velocityDisabled: true }}
  doubleClick={{ disabled: true }}
  wheel={{ smoothStep: 0 }} // Immediate zoom, no smoothing
  alignmentAnimation={{ disabled: true }}
  velocityAnimation={{ disabled: true }}
>
```

**Custom Implementation (if needed):**
- Direct transform matrix updates from mouse/wheel events
- No requestAnimationFrame smoothing
- Canvas redraw immediately after transform change

## 6. Marker Clustering

### 05-CONTEXT.md Decision:
"Overlapping markers: Claude's discretion - implement clustering, stacking, or overlap based on performance and UX best practices"

### Recommended: Defer clustering to Phase 6

**Rationale:**
- Viewport culling already handles performance for 500+ markers
- Clustering adds UI complexity (expand/collapse interactions)
- Users may prefer seeing all markers simultaneously for spatial awareness
- Can add clustering post-launch if users report too much visual clutter

**If Needed:**
- Use Supercluster library (fast, industry-standard)
- Cluster at low zoom levels, expand at high zoom levels
- Display marker count badge on cluster

## 7. Technology Stack Summary

### Core Libraries:
1. **HTML5 Canvas** - Marker and floor plan rendering
2. **react-zoom-pan-pinch** - Pan/zoom controls (configured for no momentum)
3. **react-laag** - Popup positioning with edge detection

### Existing Project Dependencies (Reuse):
- React 18.3.1 (already installed)
- @mui/material 7.3.7 (for filter UI toolbar/sidebar)
- react-icons 5.5.0 (for category icons on markers)
- Zod 4.3.6 (for validation)

### New Dependencies Required:
- `react-zoom-pan-pinch`: ^3.6.1 (pan/zoom)
- `react-laag`: ^2.0.5 (popup positioning)

### Coordinate System:
- Markers stored as normalized coordinates (0.0-1.0) in database
- Transform to canvas pixel coordinates: `pixelX = normalizedX * canvasWidth`
- Existing `CoordinateTransformationService` from Phase 1 handles transformations

## 8. Filtering UI Architecture

### Hybrid Approach (from 05-CONTEXT.md):
"Filter UI layout: Hybrid approach - quick filters in toolbar (always visible), detailed controls in collapsible sidebar when needed"

**Toolbar (Always Visible):**
- Category visibility toggles (icon chips)
- "Show All" reset button
- Status dropdown filter
- Search box for asset tag/name

**Collapsible Sidebar:**
- Detailed category list with checkboxes
- Status filter with multiple selection
- Location filter (site/building/floor hierarchy)
- Marker count per category

### Status Filtering Visual (from 05-CONTEXT.md):
"Status filtering visual: Dim non-matching markers to 30% opacity. Matching markers stay full brightness. Maintains context while focusing attention."

**Implementation:**
- Render all markers on canvas
- Apply `globalAlpha = 0.3` for filtered-out markers
- Full `globalAlpha = 1.0` for matching markers
- No DOM re-renders needed (pure canvas operation)

## 9. Implementation Order

Based on dependencies and iterative delivery:

### Plan 1: Canvas Infrastructure
- Canvas component with floor plan image rendering
- Basic coordinate system (normalized to pixels)
- Responsive canvas sizing

### Plan 2: Pan/Zoom Controls
- Integrate react-zoom-pan-pinch
- Configure for direct/immediate feel (no momentum)
- Arrow buttons + drag + wheel zoom + pinch gestures
- Transform state management

### Plan 3: Marker Rendering
- Fetch markers for current floor plan
- Render markers on canvas with category icons/colors
- Hit detection for marker clicks
- Initial render all markers (defer viewport culling)

### Plan 4: Marker Popups
- Popup component with asset summary
- react-laag positioning integration
- Navigation to asset detail view
- Dismissal handling

### Plan 5: Filtering & Visibility
- Toolbar with category toggles
- Collapsible sidebar with detailed filters
- Status filter with dim-to-30% opacity
- Filter state management and canvas re-render

---

*Research completed: 2026-02-12*
*Sources compiled from: 2026 web search results*
