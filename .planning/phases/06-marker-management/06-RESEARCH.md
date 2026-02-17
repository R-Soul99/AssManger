# Phase 6: Marker Management - Research

**Researched:** 2026-02-17
**Domain:** Canvas interaction, drag behavior, coordinate transformation, MUI Autocomplete, edit mode architecture
**Confidence:** HIGH (codebase directly inspected, library APIs verified)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Edit Mode Entry
- Explicit "Edit Markers" toggle button in the existing viewer toolbar (alongside back button and floor plan name)
- The button shows as active/highlighted when in edit mode
- Cursor changes to a crosshair over the canvas when in edit mode
- Markers are only draggable in edit mode (locked in view mode)
- Click behavior when in edit mode (existing marker vs empty space): Claude's Discretion

#### Marker Placement Flow
- Clicking empty canvas in edit mode places an unlinked placeholder marker immediately at that position
- The placeholder marker is visually distinct from linked markers: Claude's Discretion on exact styling
- To link, user clicks the placeholder and a UI appears to search/select an existing asset
- Asset search/link UI: Claude's Discretion (most practical for desktop — likely a searchable combobox or compact dialog)
- "Create new asset" option available from the link UI — opens a quick-create form with only required fields (asset tag, category); full details can be filled later from the asset list

#### Drag vs Pan Conflict
- In edit mode, normal drag on a marker moves it (repositioning)
- In edit mode, holding Space + drag pans the map (Figma/Photoshop pattern)
- Small activation distance (~6px) before a marker drag starts — prevents accidental repositioning when clicking to link/edit
- Undo (Ctrl+Z) for marker moves: Claude's Discretion based on implementation complexity

#### Marker Deletion & Editing
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MRK-01 | User can click on floor plan to place new marker | Canvas click handler with coordinate conversion from screen to normalized; must detect click on empty space vs existing marker |
| MRK-02 | User can link new marker to existing asset via search/dropdown | MUI Autocomplete with asset search from IAssetRepository.findAll(); filterOptions for client-side search |
| MRK-03 | User can create new asset directly from marker placement workflow | Reuse existing AssetService.createAsset() and existing form pattern; mini-form with tag + category + location only |
| MRK-04 | User can drag marker to reposition it on floor plan | react-zoom-pan-pinch panning.activationKeys=[" "] for Space+drag pan; canvas mousedown/mousemove/mouseup for marker drag |
| MRK-05 | User can delete marker from floor plan | IMarkerRepository.delete() already implemented; need confirmation UI in edit popup |
| MRK-06 | System stores marker coordinates as normalized values (0.0-1.0) | CoordinateTransformService.pixelToNormalized() already exists; use when saving placed/moved markers |
| MRK-07 | System transforms normalized coordinates to pixels during rendering | Already implemented in FloorPlanCanvas drawMarker(); extend to draw unlinked placeholder markers |
| MRK-08 | Marker icons/colors automatically match linked asset's category | Already implemented in drawMarker() using category.color; unlinked markers need distinct styling (different color/shape) |
| MRK-09 | User can see marker count per floor plan | FloorPlanList already loads marker counts via floorPlanRepo.getMarkerCount(); toolbar count needs filter-aware calculation |
</phase_requirements>

---

## Summary

Phase 6 extends the read-only floor plan viewer (built in Phase 5) with a write layer for marker placement, linking, repositioning, and deletion. The core technical challenge is managing three competing interaction modes on the same canvas: pan (via react-zoom-pan-pinch), marker click (hit test), and marker drag. The project already has the full data layer in place — IMarkerRepository with save/update/delete, CoordinateTransformService for normalized coordinates, and MarkerService for enriched reads. What is missing is the edit mode UI layer, the unlinked placeholder concept, and the drag/placement interaction machinery.

A critical database schema constraint was discovered during research: the `markers` table has `assetId NOT NULL` with a foreign key. The "unlinked placeholder" concept (per the locked decisions) must therefore be implemented as **client-side-only React state** — an unlinked placeholder is never persisted. The placeholder exists only while the user is in the asset-linking flow; once an asset is selected (or a new asset created), the marker is saved with assetId. If the user dismisses without linking, the placeholder is discarded. This is the correct architecture.

The Space+drag pan pattern is natively supported by `react-zoom-pan-pinch` v3.7.0 via `panning.activationKeys: [" "]`. This means: by default (in edit mode) panning is DISABLED; with Space held, panning is re-enabled. This cleanly separates marker drag from pan without needing any state management — the library handles the key detection internally. In edit mode, set `panning={{ activationKeys: [" "] }}`; in view mode, set `panning={{ disabled: false }}` (normal panning).

**Primary recommendation:** Implement edit mode as a state flag on FloorPlanViewer that switches the canvas between (a) view mode (markers clickable for popup) and (b) edit mode (click empty = place placeholder, click marker = edit popup, drag marker = reposition, Space+drag = pan). All data operations flow through existing MarkerService/MarkerRepository.

---

## Standard Stack

### Core (Already in Project — Verified via Codebase Inspection)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-zoom-pan-pinch | 3.7.0 | Pan/zoom wrapper for canvas | Already in use; provides `panning.activationKeys` for Space+drag pattern |
| @mui/material | 7.3.7 | UI components including Autocomplete | Already in use; Autocomplete for asset search combobox |
| drizzle-orm | 0.45.1 | ORM for SQLite — marker persistence | IMarkerRepository already fully implemented |
| react-laag | 2.0.5 | Edge-aware popup positioning | Already used for MarkerPopup; extend for edit popup |
| zod | 4.3.6 | Schema validation | MarkerSchema, AssetSchema already defined |

### Supporting (Already in Project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid | 13.0.0 | Generate marker IDs | When creating new Marker entity before save |
| react-hook-form | 7.71.1 | Form handling | Quick-create asset mini-form |
| @hookform/resolvers | 5.2.2 | Zod integration with react-hook-form | Mini-form validation |

### No New Dependencies Required

This phase requires zero new npm packages. All needed capabilities exist:
- Canvas hit testing: native Canvas API
- Drag interactions: native mouse events on canvas
- Asset search: MUI Autocomplete + existing IAssetRepository.findAll()
- Marker CRUD: IMarkerRepository (all methods already implemented)
- Coordinate math: CoordinateTransformService (already exists)

**Installation:** No new packages needed.

---

## Architecture Patterns

### Current FloorPlanCanvas Structure (Phase 5)

The canvas has logical size = image dimensions (e.g., 4000x3000 pixels for a large floor plan) and CSS display size = viewport-fitted dimensions (e.g., 800x600). The canvas is wrapped in TransformWrapper/TransformComponent from react-zoom-pan-pinch. Click events on the canvas use `getBoundingClientRect()` to convert from CSS pixel space to canvas logical space via `scaleX = canvas.width / rect.width`.

```
FloorPlanViewer (container, state)
└── FloorPlanCanvas (renders canvas + handles events)
    └── TransformWrapper (react-zoom-pan-pinch)
        └── TransformComponent
            └── <canvas> (logical size = image dims)
└── FloorPlanViewerToolbar (category chips, filter, NEW: edit toggle)
└── FloorPlanFilterSidebar (status filter)
└── MarkerPopup (react-laag popup, view mode)
└── AssetDetailDrawer (full asset view)
```

### Recommended Structure Extension (Phase 6)

```
FloorPlanViewer (add: isEditMode state, placeholderMarkers state)
└── FloorPlanCanvas (add: editMode prop, onMarkerPlace, onMarkerMove, onMarkerSelect)
    └── TransformWrapper (panning changes based on mode)
        └── TransformComponent
            └── <canvas> (add: cursor, mousedown, mousemove, mouseup handlers)
└── FloorPlanViewerToolbar (add: isEditMode toggle, filtered marker count)
└── MarkerPopup (view mode — unchanged)
└── MarkerEditPopup (NEW: edit mode popup with Edit/Delete/Relink actions)
└── AssetLinkDialog (NEW: combobox search + "Create new asset" option)
└── QuickCreateAssetForm (NEW: minimal form — tag + category + location)
```

### Pattern 1: Space+Drag Pan in Edit Mode

**What:** Use `panning.activationKeys: [" "]` on TransformWrapper in edit mode so panning only activates when Space is held. Normal drag on empty space is consumed by canvas click handler (placing a marker). Normal drag starting on a marker triggers marker repositioning.

**When to use:** Whenever isEditMode is true.

```typescript
// Source: react-zoom-pan-pinch v3.7.0 docs (verified via type definitions)
<TransformWrapper
  ref={ref}
  initialScale={1}
  minScale={0.5}
  maxScale={5}
  wheel={{ step: 0.1 }}
  panning={isEditMode
    ? { activationKeys: [" "] }  // Space+drag to pan; normal drag is marker interaction
    : { disabled: false }         // view mode: normal drag pans
  }
  doubleClick={{ disabled: true }}
  velocityAnimation={{ disabled: true }}
>
```

**Key insight:** `activationKeys: [" "]` means panning ONLY activates when the Space key is held. Without Space held, react-zoom-pan-pinch will not intercept pointer events for panning — so marker drag and canvas clicks work naturally.

### Pattern 2: Canvas Click → Normalized Coordinates

**What:** Convert a canvas click event to normalized coordinates (0.0-1.0) for marker placement.

```typescript
// Source: Codebase inspection (FloorPlanCanvas.tsx handleCanvasClick)
// Extended for marker placement:
const screenToNormalized = (
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): { normalizedX: number; normalizedY: number } => {
  const rect = canvas.getBoundingClientRect();
  // Scale factors: canvas logical size vs CSS display size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  // Convert to canvas logical pixel space
  const canvasX = (e.clientX - rect.left) * scaleX;
  const canvasY = (e.clientY - rect.top) * scaleY;
  // Normalize to 0.0-1.0
  return {
    normalizedX: Math.max(0, Math.min(1, canvasX / canvas.width)),
    normalizedY: Math.max(0, Math.min(1, canvasY / canvas.height)),
  };
};
```

**Note:** This pattern already exists in `handleCanvasClick` in FloorPlanCanvas.tsx. Phase 6 extends it to also handle mousedown/mousemove/mouseup for drag.

### Pattern 3: Marker Hit Testing

**What:** Determine whether a click lands on an existing marker (linked or placeholder) vs empty space.

```typescript
// Source: Codebase inspection (FloorPlanCanvas.tsx handleCanvasClick, line 192-197)
// Extended for Phase 6:
const findMarkerAtPosition = (
  canvasX: number,
  canvasY: number,
  canvas: HTMLCanvasElement,
  markers: MarkerWithDetails[],
  placeholders: PlaceholderMarker[]
): MarkerWithDetails | PlaceholderMarker | null => {
  const MARKER_RADIUS = 12; // must match drawMarker radius

  // Check linked markers first
  for (const m of markers) {
    const mx = m.marker.normalizedX * canvas.width;
    const my = m.marker.normalizedY * canvas.height;
    const dist = Math.sqrt((canvasX - mx) ** 2 + (canvasY - my) ** 2);
    if (dist <= MARKER_RADIUS) return m;
  }

  // Check placeholder markers
  for (const p of placeholders) {
    const px = p.normalizedX * canvas.width;
    const py = p.normalizedY * canvas.height;
    const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2);
    if (dist <= MARKER_RADIUS) return p;
  }

  return null;
};
```

**Note:** 12px radius matches the existing `drawMarker()` circle. Hit detection must check placeholders too.

### Pattern 4: Marker Drag with Activation Distance

**What:** Implement drag-to-reposition with ~6px activation distance to distinguish click (for popup) from drag (for move).

```typescript
// Source: Codebase inspection — dnd-kit PointerSensor uses distance:8 (FloorPlanList.tsx line 56-60)
// Canvas version — implemented via mousedown/mousemove/mouseup:

const DRAG_ACTIVATION_DISTANCE = 6; // pixels in canvas logical space

// In handleCanvasMouseDown (edit mode):
const startDrag = (marker, startX, startY) => {
  dragState.current = {
    marker,
    startX,
    startY,
    isDragging: false, // Not yet activated
    hasMoved: false,
  };
};

// In handleCanvasMouseMove:
if (dragState.current && !dragState.current.isDragging) {
  const dx = canvasX - dragState.current.startX;
  const dy = canvasY - dragState.current.startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= DRAG_ACTIVATION_DISTANCE) {
    dragState.current.isDragging = true;
    dragState.current.hasMoved = true;
  }
}

// In handleCanvasMouseUp:
if (dragState.current && !dragState.current.hasMoved) {
  // Treat as click — show edit popup
} else if (dragState.current?.isDragging) {
  // Save new position to DB
}
```

### Pattern 5: Unlinked Placeholder as React State Only

**What:** Placeholder markers are pure client-side state. They are NEVER persisted to the database (schema requires assetId NOT NULL). When a placeholder is linked to an asset, a new Marker is saved via markerRepository.save().

```typescript
// Source: Codebase inspection (schema.ts line 53 — assetId NOT NULL)
interface PlaceholderMarker {
  id: string;          // temporary UUID, replaced when saved
  normalizedX: number;
  normalizedY: number;
  isPlaceholder: true;
}

// State in FloorPlanViewer or FloorPlanCanvas:
const [placeholders, setPlaceholders] = useState<PlaceholderMarker[]>([]);

// On canvas click (empty space, edit mode):
const newPlaceholder: PlaceholderMarker = {
  id: uuidv4(),
  normalizedX,
  normalizedY,
  isPlaceholder: true,
};
setPlaceholders(prev => [...prev, newPlaceholder]);
setSelectedPlaceholder(newPlaceholder); // opens AssetLinkDialog

// On successful asset link:
await markerRepository.save({
  id: uuidv4(),
  floorPlanId,
  assetId: selectedAsset.id,
  normalizedX: placeholder.normalizedX,
  normalizedY: placeholder.normalizedY,
  createdAt: new Date(),
  updatedAt: new Date(),
});
setPlaceholders(prev => prev.filter(p => p.id !== placeholder.id));
// refresh markers
```

### Pattern 6: Asset Search with MUI Autocomplete

**What:** Searchable combobox that filters existing assets. Client-side filtering is sufficient (asset list is small in typical deployment).

```typescript
// Source: MUI v7 documentation (verified via official docs)
// Asset search in AssetLinkDialog:
<Autocomplete
  options={allAssets}
  getOptionLabel={(option) => `${option.tag} — ${option.description}`}
  isOptionEqualToValue={(option, value) => option.id === value.id}
  filterOptions={createFilterOptions({
    stringify: (option) => `${option.tag} ${option.description}`,
    limit: 50,
  })}
  onChange={(_, selectedAsset) => {
    if (selectedAsset) handleLinkAsset(selectedAsset);
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Search assets"
      placeholder="Type tag or description..."
      autoFocus
    />
  )}
  renderOption={(props, option) => (
    <li {...props} key={option.id}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 12, height: 12, borderRadius: '50%',
                   backgroundColor: option.category?.color || '#999' }} />
        <span>{option.tag}</span>
        <Typography variant="caption" color="text.secondary">
          {option.description}
        </Typography>
      </Box>
    </li>
  )}
/>
```

### Pattern 7: Filtered Marker Count in Toolbar

**What:** The viewer toolbar must show marker count respecting current category/status filters.

```typescript
// Source: Codebase inspection (FloorPlanViewer.tsx — markerCounts already computed line 107-113)
// Extend the existing markerCounts calculation:
const filteredMarkerCount = useMemo(() => {
  return markers.filter(({ marker, asset, category }) => {
    const categoryVisible = visibleCategories.has(category.id);
    const statusMatches = selectedStatus === 'all' || asset.status === selectedStatus;
    return categoryVisible && statusMatches;
  }).length;
}, [markers, visibleCategories, selectedStatus]);
```

### Pattern 8: Drawing Placeholder Markers on Canvas

**What:** Placeholder markers must be visually distinct from linked markers. Recommended styling: dashed outline circle (not filled) with a "+" icon or question mark, using a neutral grey color.

```typescript
// Source: Codebase inspection (FloorPlanCanvas.tsx drawMarker pattern, lines 32-81)
function drawPlaceholderMarker(
  ctx: CanvasRenderingContext2D,
  placeholder: PlaceholderMarker,
  canvasWidth: number,
  canvasHeight: number,
  isSelected: boolean
) {
  const x = placeholder.normalizedX * canvasWidth;
  const y = placeholder.normalizedY * canvasHeight;
  const radius = 12;

  // Dashed circle outline (distinct from filled linked markers)
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.setLineDash([4, 3]); // dashed outline
  ctx.strokeStyle = isSelected ? '#1976d2' : '#666666';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // "+" icon
  ctx.fillStyle = isSelected ? '#1976d2' : '#666666';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', x, y);
}
```

### Anti-Patterns to Avoid

- **Persisting unlinked markers:** The database schema has `assetId NOT NULL`. Never attempt to save a marker without assetId. Keep placeholders in React state only.
- **Using dnd-kit for canvas marker drag:** dnd-kit's drag events are intercepted by react-zoom-pan-pinch's TransformWrapper. Use native canvas mousedown/mousemove/mouseup events instead.
- **Reading transform state via ReactZoomPanPinchRef.state for coordinate conversion:** The canvas already accounts for zoom via getBoundingClientRect(). The canvas's getBoundingClientRect() reflects the zoomed CSS display size, so the scaleX/scaleY calculation automatically handles react-zoom-pan-pinch's transform. No need to read positionX/positionY from the ref for coordinate conversion.
- **Rebuilding asset search:** AssetFilters interface already has `searchTerm` field that searches tag, description, serial, phone. Use client-side filtering via MUI Autocomplete's createFilterOptions — no new repository queries needed.
- **Separate edit mode component:** Do not create a separate FloorPlanEditorCanvas component. Extend FloorPlanCanvas with an `isEditMode` prop — the canvas rendering and event handling logic is highly interdependent and splitting creates unnecessary complexity.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Space+drag pan in edit mode | Custom keyboard+mouse event handler | `panning.activationKeys: [" "]` in TransformWrapper | Library natively supports this; zero custom code |
| Asset search filtering | Custom search algorithm | MUI Autocomplete + createFilterOptions | Built-in fuzzy matching, keyboard navigation, accessibility |
| Asset form validation | Custom validation logic | Existing AssetSchema (zod) + react-hook-form | Already validated in CreateAssetForm; reuse patterns |
| Marker coordinate storage | Custom coordinate format | Existing MarkerSchema (normalized 0.0-1.0) + CoordinateTransformService | Already implemented and tested |
| Popup positioning | Custom popup with edge detection | react-laag (already used for MarkerPopup) | Edge-aware positioning handles viewport edges automatically |
| Marker CRUD operations | New repository layer | IMarkerRepository (save/update/delete already implemented) | All methods exist; just add MarkerService methods for create/move/delete |

**Key insight:** The Phase 5 codebase is unusually complete for Phase 6's needs. The primary work is wiring up existing pieces with a new interaction model, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Canvas Coordinate Conversion Double-Scaling

**What goes wrong:** Applying react-zoom-pan-pinch's transform (positionX, positionY, scale) on top of getBoundingClientRect() — this double-counts the zoom.

**Why it happens:** Developers expect to need to "undo" the zoom transform manually. But `getBoundingClientRect()` on the zoomed canvas already returns the scaled display size, so the `scaleX = canvas.width / rect.width` calculation automatically accounts for react-zoom-pan-pinch's transform.

**How to avoid:** Use only the existing pattern from `handleCanvasClick`: `scaleX = canvas.width / rect.width`. Do NOT add positionX/positionY/scale from the TransformWrapper ref.

**Warning signs:** Markers appear to be placed at wrong positions — offset from where the user clicked, especially when zoomed in.

### Pitfall 2: Panning Intercepts Edit Mode Clicks

**What goes wrong:** react-zoom-pan-pinch captures mousedown on the canvas and triggers panning, preventing click-to-place from firing.

**Why it happens:** Default panning behaviour in react-zoom-pan-pinch intercepts all pointer events on its content. A single click still fires (short drag), but the coordinates may be off and the UX feels laggy.

**How to avoid:** In edit mode, use `panning={{ activationKeys: [" "] }}` so panning only activates on Space+drag. Normal clicks and drags are not intercepted by react-zoom-pan-pinch.

**Warning signs:** Click-to-place works on first click but then pan starts unexpectedly, OR placed markers appear at wrong position after panning.

### Pitfall 3: Marker Drag Triggers Edit Popup

**What goes wrong:** Starting to drag a marker opens the edit popup (treated as click) instead of initiating repositioning.

**Why it happens:** Missing activation distance check — mouseup fires without checking whether movement occurred.

**How to avoid:** Track `dragStartX/dragStartY` in a ref on mousedown. Only treat as click if total movement is < 6px by mouseup. Use `useRef` (not useState) for drag state to avoid re-renders during drag.

**Warning signs:** Edit popup flickers open when attempting to drag markers.

### Pitfall 4: Placeholder Markers Lost on Re-render

**What goes wrong:** Placeholder markers disappear when any state update triggers a re-render.

**Why it happens:** If placeholder state is stored inside FloorPlanCanvas (which re-renders on imageData, markers, selectedMarker changes), the state may reset.

**How to avoid:** Store placeholder markers in FloorPlanViewer (parent) state, not FloorPlanCanvas. Pass as a prop to FloorPlanCanvas for rendering. Alternatively, use a stable ref for placeholders.

**Warning signs:** User places a marker, canvas re-renders due to filters changing, placeholder disappears before they can link it.

### Pitfall 5: Stale Marker List After CRUD Operations

**What goes wrong:** After placing, deleting, or moving a marker, the canvas still shows the old state.

**Why it happens:** `useMarkers` hook only fetches on mount/floorPlanId change. It has no refresh mechanism.

**How to avoid:** Add a `refreshTrigger` state (counter) to FloorPlanViewer, pass to useMarkers, increment after any CRUD operation. Or refactor useMarkers to expose a `refresh()` function.

```typescript
// Pattern for refresh trigger:
const [markerVersion, setMarkerVersion] = useState(0);
const { markers } = useMarkers(floorPlanId, markerVersion); // add dependency
const refreshMarkers = () => setMarkerVersion(v => v + 1);
```

**Warning signs:** After placing a marker and linking it, the marker doesn't appear until page reload.

### Pitfall 6: Asset Autocomplete Loads Too Many Options

**What goes wrong:** Autocomplete loads all assets on open and renders a huge list, making it slow.

**Why it happens:** findAllWithRelations() fetches everything including relations. For large deployments (thousands of assets), this is expensive.

**How to avoid:** Use `findAll()` (not `findAllWithRelations()`) for the link dialog — we only need asset.id, asset.tag, asset.description, asset.categoryId. Category color can be resolved separately. Alternatively, lazy-load assets only when the dialog opens.

**Warning signs:** AssetLinkDialog is slow to open on projects with many assets.

### Pitfall 7: Delete Without Confirmation Causes Data Loss

**What goes wrong:** User accidentally clicks Delete in the edit popup and loses a marker position that was difficult to place accurately.

**Why it happens:** Edit popups with immediate-action Delete buttons are common but risky. Unlike the asset list view (which has bulk selection safety), a single marker deletion is harder to recover from.

**How to avoid:** Require one confirmation step. Recommended: show "Delete Marker?" with Confirm/Cancel inside the popup itself (inline confirmation, not a dialog). This adds one click but prevents accidental loss.

**Warning signs:** User complaints about losing markers they spent time placing.

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Edit Mode Canvas Props (react-zoom-pan-pinch v3.7.0)
```typescript
// Source: react-zoom-pan-pinch type definitions (verified via unpkg)
// In FloorPlanCanvas:
<TransformWrapper
  ref={ref}
  initialScale={1}
  minScale={0.5}
  maxScale={5}
  wheel={{ step: 0.1 }}
  panning={isEditMode
    ? { activationKeys: [" "] }  // Only pan when Space held
    : { disabled: false }          // Normal pan in view mode
  }
  doubleClick={{ disabled: true }}
  velocityAnimation={{ disabled: true }}
>
```

### MarkerService Extension for Mutation Operations
```typescript
// Source: Codebase inspection (MarkerService.ts — currently read-only)
// Add to MarkerService:
async placeMarker(
  floorPlanId: string,
  assetId: string,
  normalizedX: number,
  normalizedY: number
): Promise<Marker> {
  const markerData: MarkerData = {
    id: uuidv4(),
    floorPlanId,
    assetId,
    normalizedX: Math.max(0, Math.min(1, normalizedX)),
    normalizedY: Math.max(0, Math.min(1, normalizedY)),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = Marker.create(markerData);
  if (!result.success) throw new Error(result.errors.join(', '));
  await this.markerRepository.save(markerData);
  return result.entity;
}

async moveMarker(markerId: string, normalizedX: number, normalizedY: number): Promise<void> {
  await this.markerRepository.update(markerId, {
    normalizedX: Math.max(0, Math.min(1, normalizedX)),
    normalizedY: Math.max(0, Math.min(1, normalizedY)),
  });
}

async deleteMarker(markerId: string): Promise<void> {
  await this.markerRepository.delete(markerId);
}

async relinkMarker(markerId: string, newAssetId: string): Promise<void> {
  await this.markerRepository.update(markerId, { assetId: newAssetId });
}
```

### Drag State Management with useRef
```typescript
// Source: Codebase inspection (FloorPlanCanvas pattern) + standard React drag patterns
interface DragState {
  markerId: string;
  isPlaceholder: boolean;
  startCanvasX: number;
  startCanvasY: number;
  currentCanvasX: number;
  currentCanvasY: number;
  activated: boolean; // true once DRAG_ACTIVATION_DISTANCE exceeded
}

// Use ref (not state) to avoid re-renders during drag:
const dragStateRef = useRef<DragState | null>(null);
const DRAG_ACTIVATION_DISTANCE = 6;

const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isEditMode) return;
  const { canvasX, canvasY } = screenToCanvas(e, canvas);
  const hit = findMarkerAtPosition(canvasX, canvasY, canvas, markers, placeholders);
  if (hit) {
    dragStateRef.current = {
      markerId: hit.id,
      isPlaceholder: 'isPlaceholder' in hit,
      startCanvasX: canvasX,
      startCanvasY: canvasY,
      currentCanvasX: canvasX,
      currentCanvasY: canvasY,
      activated: false,
    };
  }
};

const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!dragStateRef.current) return;
  const { canvasX, canvasY } = screenToCanvas(e, canvas);
  dragStateRef.current.currentCanvasX = canvasX;
  dragStateRef.current.currentCanvasY = canvasY;
  if (!dragStateRef.current.activated) {
    const dx = canvasX - dragStateRef.current.startCanvasX;
    const dy = canvasY - dragStateRef.current.startCanvasY;
    if (Math.sqrt(dx * dx + dy * dy) >= DRAG_ACTIVATION_DISTANCE) {
      dragStateRef.current.activated = true;
    }
  }
  if (dragStateRef.current.activated) {
    // Trigger canvas redraw with dragged marker at new position
    requestAnimationFrame(redrawCanvas);
  }
};
```

### Quick-Create Asset Mini-Form
```typescript
// Source: Codebase inspection (CreateAssetForm.tsx — fields: tag, description, categoryId, locationId)
// Mini-form for marker flow uses same AssetService.createAsset() but inline in a Dialog:
interface QuickCreateAssetFormProps {
  open: boolean;
  onClose: () => void;
  onAssetCreated: (asset: Asset) => void; // returns the new asset for immediate linking
}
// Required fields only: tag (string), category (Select), location (Select)
// description defaults to tag value or can be auto-filled
// NO: serialNumber, phoneExtension, status, owner, costCentre, notes, cost, purchaseDate
```

### Filtered Marker Count
```typescript
// Source: Codebase inspection (FloorPlanViewer.tsx markerCounts useMemo, lines 107-113)
// Add to FloorPlanViewerToolbar props:
const filteredMarkerCount = useMemo(() => {
  return markers.filter(({ asset, category }) => {
    const categoryVisible = visibleCategories.has(category.id);
    const statusMatches = selectedStatus === 'all' || asset.status === selectedStatus;
    return categoryVisible && statusMatches;
  }).length;
}, [markers, visibleCategories, selectedStatus]);
// Display in toolbar: `${filteredMarkerCount} marker${filteredMarkerCount !== 1 ? 's' : ''}`
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-zoom-pan-pinch requires disabling panning for clicks | panning.activationKeys enables key-conditional panning | v3.x | Enables Space+drag pattern natively without custom event handling |
| Custom canvas drag for markers | Native mousedown/mousemove/mouseup on canvas | Always standard | dnd-kit not suitable for canvas-based drag |
| MUI Autocomplete client-side only | createFilterOptions for client filtering, filterOptions={(x)=>x} for server | MUI v5+ | Asset search can be either client-side (small lists) or server-side (large) |

**Existing code to verify still current:**
- `react-zoom-pan-pinch` version in package.json is 3.7.0 — matches documented API
- `@mui/material` version is 7.3.7 — Autocomplete API is stable since v5

---

## Open Questions

1. **Re-linking support decision (Claude's Discretion)**
   - What we know: Marker entity has assetId; `markerRepository.update()` supports partial updates including assetId
   - What's unclear: User-facing UX — is "Swap Asset" worth adding vs "Delete and re-place"?
   - Recommendation: Support re-linking. Cost is low (one `update()` call), and the UX benefit is high (avoids losing precise marker position when the wrong asset was linked). Show "Change Asset" button in the edit popup that re-opens AssetLinkDialog with current selection highlighted.

2. **Undo for marker moves (Claude's Discretion)**
   - What we know: No undo infrastructure exists in the project; implementing full undo is significant complexity
   - What's unclear: How often users will accidentally reposition markers vs intentionally move them
   - Recommendation: Skip undo. The 6px activation distance prevents most accidents. If the user moves a marker, they can drag it back. Document this decision.

3. **QuickCreate asset "description" field requirement**
   - What we know: AssetSchema requires description as min(1) string; existing CreateAssetForm has description as separate required field
   - What's unclear: Should the mini-form require a separate description, or auto-fill from tag?
   - Recommendation: Include description as a required field in the mini-form (it's the human-readable name). Two required fields (tag + description) plus category and location is acceptable for a "quick" create. Auto-populating description from tag would create dirty data.

4. **Canvas redraw performance during drag**
   - What we know: The canvas renders all markers on every state change (markers.length can be hundreds)
   - What's unclear: Whether requestAnimationFrame-based redraw during drag will be smooth at scale
   - Recommendation: Use requestAnimationFrame for drag redraw. The canvas approach (clear and redraw all) is standard and performant for this use case. If performance is an issue, track the drag marker's position in a ref and only update it in the drawMarker pass without re-fetching from state.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/presentation/components/floorplan/FloorPlanCanvas.tsx` — canvas rendering, coordinate conversion, hit testing patterns
- Codebase inspection: `src/presentation/components/floorplan/FloorPlanViewer.tsx` — container architecture, state management
- Codebase inspection: `src/application/services/MarkerService.ts` — current service API (read-only)
- Codebase inspection: `src/infrastructure/repositories/interfaces/IMarkerRepository.ts` — save/update/delete all exist
- Codebase inspection: `src/infrastructure/repositories/sqlite/SqliteMarkerRepository.ts` — all CRUD implemented
- Codebase inspection: `src/infrastructure/database/schema.ts` — assetId NOT NULL confirmed, cascade deletes
- Codebase inspection: `src/application/services/CoordinateTransformService.ts` — pixelToNormalized exists
- Codebase inspection: `src/presentation/components/floorplan/FloorPlanList.tsx` — marker count loading pattern
- Codebase inspection: `src/presentation/components/floorplan/FloorPlanCard.tsx` — markerCount prop already displayed
- react-zoom-pan-pinch v3.7.0 type definitions via unpkg — `panning.activationKeys` prop confirmed

### Secondary (MEDIUM confidence)
- WebSearch: react-zoom-pan-pinch `panning.activationKeys: [" "]` enables Space+drag pattern (multiple sources agree)
- WebSearch: react-zoom-pan-pinch `panning.disabled` prop for programmatic panning control
- WebSearch: Canvas coordinate conversion with getBoundingClientRect + scaleX/scaleY pattern (authoritative sources)
- WebSearch: MUI Autocomplete `createFilterOptions` for client-side asset search (official MUI docs referenced)
- WebSearch: MUI Autocomplete `filterOptions={(x)=>x}` bypass for server-side filtering

### Tertiary (LOW confidence)
- WebSearch: dnd-kit drag events intercepted by react-zoom-pan-pinch TransformWrapper (GitHub issue #460) — confirms native canvas events are the right approach, not dnd-kit

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, versions confirmed
- Architecture: HIGH — codebase directly inspected, all patterns traced
- Canvas interaction patterns: HIGH — canvas hit test and coordinate conversion already implemented in Phase 5 code
- react-zoom-pan-pinch activationKeys: MEDIUM — type definitions confirmed, behavior described in docs/search, but not tested in this exact codebase yet
- MUI Autocomplete: MEDIUM — well-documented library, stable API
- Drag implementation detail: MEDIUM — pattern is standard, but edge cases (mouseup outside canvas, touch) need consideration

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable libraries; 30-day window)
