# Pitfalls Research

**Domain:** Visual Asset Management & Floor Plan Visualization
**Researched:** 2026-01-28
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: SQLite Database Corruption in Cloud-Synced Folders

**What goes wrong:**
Database files become corrupted when stored in OneDrive/SharePoint sync folders. Access databases don't read and write database files as a whole like Word or Excel; instead, they write to individual pages within the database file, updating the file's last-modified stamp each time. This triggers synchronization with each page write, causing lock contention with the database file. Multiple simultaneous users see incompletely updated data pages, leading to database corruption.

**Why it happens:**
- Cloud sync services monitor file changes at the OS level and sync partial writes
- SQLite's page-level locking doesn't work reliably over network/synced file systems
- OneDrive's "Files on Demand" creates additional locking complications
- Transaction commits can be interrupted mid-write by sync processes

**How to avoid:**
- NEVER store active SQLite databases in cloud-synced folders (OneDrive, SharePoint, Dropbox, Google Drive)
- Use local storage outside sync directories (e.g., `%LOCALAPPDATA%` instead of `%USERPROFILE%\OneDrive`)
- If cloud sync is required, implement a client-server architecture with database on server
- For single-user scenarios, use explicit backup mechanisms instead of relying on cloud sync
- Enable WAL (Write-Ahead Logging) mode for better concurrency protection (SQLite 3.51.0+)

**Warning signs:**
- "Database is locked" errors appearing intermittently
- Database file size unexpectedly growing (OneDrive sync conflicts)
- SQLite error codes: SQLITE_BUSY, SQLITE_LOCKED, SQLITE_CORRUPT
- Presence of `~$` temporary files or `.tmp` files next to database
- OneDrive sync status showing "processing changes" for extended periods

**Phase to address:**
Phase 1 (Database Setup) - Document storage location requirements clearly in setup/installation. Consider detecting cloud sync paths programmatically and warning users during first run.

---

### Pitfall 2: Canvas Performance Degradation with Large Marker Sets

**What goes wrong:**
Rendering hundreds or thousands of asset markers on large floor plan images causes severe UI lag, freezing, or crashes. Methods like `beginPath`, `arc`, `fill`, and `stroke` run on the main thread - when called thousands of times per frame, they create performance bottlenecks. Drawing 1000 objects with SVG requires ~10ms whereas canvas requires 1ms, but naive canvas implementations still struggle at scale.

**Why it happens:**
- Full canvas redraws on every pan/zoom operation redraw all markers
- No viewport culling - markers outside visible area still rendered
- Lack of dirty flag patterns - unchanged elements re-rendered unnecessarily
- Single canvas layer forces everything to redraw together
- Pixel-based coordinate systems require recalculation on every zoom level

**How to avoid:**
- Implement viewport filtering - only render markers visible in current view
- Use spatial data structures (R-Tree) for fast marker lookup by bounding box
- Apply dirty flag pattern - track which markers changed and redraw only those
- Use multiple canvas layers: static background, dynamic markers, UI overlay
- Batch rendering operations - group draw calls and execute in single pass
- Implement offscreen canvas for marker sprites - render once, reuse multiple times
- For extreme scale (10k+ markers), consider WebGL rendering instead of 2D canvas
- Use `requestAnimationFrame()` instead of `setInterval()` for smooth animations

**Warning signs:**
- Frame rate drops below 30fps during pan/zoom operations
- Browser DevTools Performance tab shows long tasks (>50ms) during canvas operations
- CPU usage spikes to 100% when interacting with floor plan
- UI becomes unresponsive when loading floor plans with >500 markers
- Mobile devices show significantly worse performance than desktop

**Phase to address:**
Phase 2 (Canvas Rendering) - Implement basic viewport culling and layer separation. Phase 4 (Performance Optimization) - Add R-Tree indexing and advanced rendering optimizations when user base grows.

---

### Pitfall 3: Inaccurate Two-Point Scale Calibration

**What goes wrong:**
Users set scale calibration incorrectly, leading to systematically wrong measurements throughout the application. Two-point calibration assumes linear response between calibration points - any non-linearity (image distortion, perspective issues, user error in point selection) makes results inaccurate everywhere except the two calibration points. Cadastral mapping studies show boundaries can be misplaced by 3-5 meters due to calibration errors, which is unacceptable by modern standards.

**Why it happens:**
- Users select calibration points on non-straight features (curved walls, furniture edges)
- Reference measurement entered incorrectly (mixing units: feet vs meters)
- Image distortion from phone camera or scanning process not accounted for
- Perspective distortion from non-orthogonal floor plan images
- No validation that calibration makes sense (e.g., 1 pixel = 100 meters)
- Users click "next" through calibration without understanding importance

**How to avoid:**
- Provide clear visual guidance: "Select two points along a straight wall or feature"
- Show real-time distance calculation as user enters reference measurement
- Implement sanity checks: warn if scale suggests pixels-per-meter is unrealistic
- Display calibration result prominently: "1 pixel = X cm" and ask for confirmation
- Offer recalibration option easily accessible from main UI
- Support multiple calibration methods (two-point, grid overlay, known room dimensions)
- Store calibration metadata with each floor plan for audit trail
- Provide visual feedback: overlay grid showing scale after calibration

**Warning signs:**
- Asset locations show items "inside walls" or far from actual positions
- Distances between known points don't match physical reality
- Users report "wrong scale" or "measurements off" in support tickets
- Calibration ratio varies wildly between similar floor plans
- Pixel-to-meter ratio outside expected range (e.g., <0.001 or >100)

**Phase to address:**
Phase 1 (Scale Calibration UI) - Implement basic two-point calibration with clear instructions. Phase 3 (Validation & UX) - Add sanity checks, visual feedback, and recalibration workflows.

---

### Pitfall 4: CSV Round-Trip Data Corruption Through Excel

**What goes wrong:**
Data exported to CSV, opened/edited in Excel, then re-imported becomes corrupted. Excel causes multiple data corruption issues: leading zeros disappear ("00123" → "123"), dates misinterpreted ("2025-10-15" becomes "Oct-15-25"), numeric values rounded or converted to scientific notation, and international characters corrupted. Excel incorrectly identifies UTF-8 files without BOM as ANSI encoding, causing data loss. Despite the format being called "Comma delimited", Excel uses system regional separator (semicolon in European countries), breaking import/export.

**Why it happens:**
- Excel auto-formats data based on heuristics (numbers, dates, phone numbers)
- Excel ignores UTF-8 encoding without BOM marker
- Regional settings affect delimiter (comma vs semicolon)
- Excel saves CSV with current regional settings, not original format
- Users don't know to use "Import Data" wizard - just double-click to open
- No explicit data type declarations in CSV format

**How to avoid:**
- Export CSV with UTF-8 BOM to ensure Excel recognizes encoding
- Quote all fields consistently (even numeric) to prevent auto-formatting
- Provide user guidance: "Use Excel's Get Data / Import feature, NOT double-click"
- Include metadata row or separate .json file with column type information
- Validate CSV on import: check encoding, detect delimiter, report anomalies
- Offer alternative formats: XLSX for Excel users, JSON for developers
- Store original data types in database to detect corruption on re-import
- Implement import preview showing how data will be interpreted before final import
- Consider using tab-delimited format instead of CSV for better Excel compatibility

**Warning signs:**
- Asset IDs like "001", "002" import as "1", "2"
- Coordinates "40.7128, -74.0060" become "40.7128  -74.006" (lost precision)
- UTF-8 characters (é, ñ, ü) become gibberish: "Ã©", "Ã±"
- Large numbers display as scientific notation: "1.23E+15"
- Users report "data changed after exporting and re-importing"

**Phase to address:**
Phase 2 (CSV Export) - Implement UTF-8 BOM and field quoting. Phase 3 (CSV Import Validation) - Add import preview, encoding detection, and corruption warnings.

---

### Pitfall 5: Pixel-Based Coordinates Failing Across Zoom Levels

**What goes wrong:**
Markers stored with pixel coordinates become misaligned when images resize, zoom changes, or floor plans load at different resolutions. Pixel coordinates are absolute integers tied to specific image resolution. If floor plan image is resized, replaced with higher-resolution version, or displayed at different viewport size, all marker positions must be recalculated or become incorrect.

**Why it happens:**
- Pixel coordinates seem simpler initially ("marker at x=150, y=200")
- Developers don't anticipate image resolution changes
- No abstraction between storage coordinates and display coordinates
- Image dimension changes (optimization, higher-res scan) invalidate all coordinates
- Multi-device support requires responsive image sizing

**How to avoid:**
- Use normalized coordinates (0.0 to 1.0 range) for marker storage
- Normalized coordinates are resolution-independent: marker at (0.5, 0.5) = center regardless of image size
- Transform normalized → pixel coordinates only during rendering
- Store image dimensions with coordinate data for validation
- Design coordinate system early - migration is painful with existing data
- Document coordinate system choice clearly in database schema

**Transformation pattern:**
```
Storage: normalized (0.0-1.0)
Display: pixel = normalized * imageDimension
Example: marker at (0.25, 0.75) on 800x600 image → (200, 450) pixels
         same marker on 1600x1200 image → (400, 900) pixels
```

**Warning signs:**
- Markers shift position when window resizes
- Markers misaligned after uploading new floor plan version
- Different users see markers at different positions (different screen sizes)
- Zoom operations require marker coordinate recalculation
- Database stores absolute pixel values like x=1523, y=842

**Phase to address:**
Phase 1 (Data Model) - Choose normalized coordinates from the start. If pixel coordinates already exist, create migration script early in Phase 2.

---

### Pitfall 6: Poor Abstraction Layer for SQLite → PostgreSQL Migration

**What goes wrong:**
Code tightly coupled to SQLite-specific features prevents clean migration to PostgreSQL. SQLite's ALTER TABLE is limited (no column drops, no type changes), date/time stored as strings instead of native types, JSON stored as TEXT instead of JSONB, transactions don't cover all schema changes. Migration reveals hard-coded SQLite idioms scattered throughout codebase, requiring extensive rewrites.

**Why it happens:**
- Developers use SQLite-specific syntax for convenience during prototyping
- No database abstraction layer or ORM used ("we'll add it later")
- SQLite's permissive type system masks problems (string vs int interchangeable)
- Testing only against SQLite - PostgreSQL compatibility untested
- SQLite limitations worked around with application logic that PostgreSQL doesn't need

**How to avoid:**
- Use ORM or query builder (SQLAlchemy, Sequelize, Diesel) from day 1
- Avoid raw SQL queries - use ORM abstractions
- Use ORM's date/time handling - don't parse string dates manually
- Design schema compatible with both databases:
  - Use standard SQL types (INTEGER, TEXT, REAL, TIMESTAMP)
  - Avoid SQLite's type flexibility (storing different types in same column)
  - Test against PostgreSQL even if using SQLite in production
- Create database abstraction layer with interface:
  ```
  interface Database {
    query(), transaction(), migrate()
  }
  class SQLiteDB implements Database
  class PostgresDB implements Database
  ```
- Document SQLite-specific workarounds with "TODO: PostgreSQL" comments
- Run integration tests against both databases periodically

**Warning signs:**
- Queries like `SELECT date(created_at)` instead of ORM date handling
- String concatenation for SQL: `"SELECT * FROM " + table`
- Type coercion in application: `parseInt(row.id)` suggests schema issue
- Comments like "SQLite workaround" in codebase
- No foreign key constraints (SQLite disables by default)
- ALTER TABLE statements in migration scripts

**Phase to address:**
Phase 1 (Database Layer) - Choose ORM and create abstraction layer immediately. Phase 5 (Multi-User Migration) - Actual database migration with minimal code changes.

---

### Pitfall 7: Relative File Paths Breaking Across Environments

**What goes wrong:**
Floor plan images stored with relative paths become inaccessible when database moves, app directory changes, or deploys to different environment. Paths like `./images/floor1.png` work on developer machine but break in production, during backups, or when database file copied to new location. Users see broken images, "file not found" errors, or empty floor plan views.

**Why it happens:**
- Relative paths calculated from current working directory, which varies
- Database file portable, but image directory isn't
- Different environments have different directory structures
- No validation that image files exist when paths stored
- Paths stored at database creation time become stale

**How to avoid:**
Early phase (single user, local files):
- Store paths relative to database file location, not working directory
- Implement path resolution: `databaseDirectory + relativeImagePath`
- Validate image file exists before storing path
- Provide "Re-link Images" feature for broken paths

Later phase (multi-user, cloud):
- Migrate to centralized storage (S3, Azure Blob, local server directory)
- Store image metadata in database: filename, size, upload date, checksum
- Store URLs or cloud storage keys instead of file paths
- Implement hybrid approach: thumbnails in database (fast), originals in cloud (scalable)

**Path storage patterns:**
```
BAD:  C:\Users\John\Documents\floor1.png     (absolute, breaks portability)
BAD:  ./images/floor1.png                    (relative to CWD, unreliable)
GOOD: images/floor1.png                      (relative to DB location)
BEST: https://storage.example.com/abc123.png (cloud URL, globally accessible)
```

**Warning signs:**
- Images load on developer machine but not production
- "File not found" errors in logs
- Database backups don't include images (orphaned data)
- Image paths contain absolute paths with usernames: `C:\Users\[name]\`
- Images break when database file copied to different location
- Different users see different images or broken images for same floor plan

**Phase to address:**
Phase 1 (Image Storage) - Use database-relative paths initially. Phase 4 or 5 (Cloud Migration) - Migrate to cloud storage when scaling to multi-user.

---

### Pitfall 8: Inadequate Asset Inventory Tracking Leading to Data Gaps

**What goes wrong:**
Incomplete asset tracking creates blind spots in inventory. Organizations track major equipment but ignore peripherals, software licenses, mobile devices, creating inaccurate inventory. Outdated asset data (last update timestamp, location changes, status transitions) causes security gaps, unexpected costs, compliance failures. Assets without proper metadata (purchase date, warranty, owner, department) lose value over time.

**Why it happens:**
- No enforcement of required fields during asset creation
- Users skip "optional" fields to save time
- No periodic data quality audits
- Asset updates not tracked (history/changelog missing)
- No validation rules for data consistency

**How to avoid:**
- Define required vs optional asset fields clearly
- Implement progressive disclosure: required fields first, optional fields later
- Add data quality metrics: "Profile Completeness: 73%"
- Provide bulk update capabilities for common changes
- Track asset history: location changes, status updates, ownership transfers
- Implement validation rules:
  - Purchase date not in future
  - Warranty expiration after purchase date
  - Asset value is positive number
- Add reminders for periodic asset audits
- Support asset photos/barcodes for physical verification

**Warning signs:**
- High percentage of assets with "Unknown" location
- Many assets missing purchase date, cost, or owner
- No audit trail showing who moved assets or when
- Reports showing "incomplete data" warnings
- Users complaining "can't find asset because description is vague"

**Phase to address:**
Phase 2 (Asset Management Features) - Implement required fields and validation. Phase 3 (Data Quality) - Add completeness tracking and bulk updates.

---

### Pitfall 9: Coordinate System Confusion (Screen vs Canvas vs Logical)

**What goes wrong:**
Canvas applications use multiple coordinate systems simultaneously - screen (CSS pixels), canvas (HTML attributes), and logical (world/model coordinates). Developers confuse these systems, causing markers to drift during zoom/pan, mouse clicks to miss targets, and transformations to behave unexpectedly. The canvas element has two distinct coordinate sizes: model coordinates for drawing (canvas.width/height attributes) and display coordinates for screen rendering (CSS width/height), and mixing these causes scaling artifacts and incorrect hit detection.

**Why it happens:**
- False sense of mastery when model and display coordinates are identical (1:1 mapping)
- Developers don't distinguish between getBoundingClientRect() (screen coords) and canvas dimensions (model coords)
- Transform matrix (translate, scale, rotate) changes coordinate system but developers forget to invert
- Mouse event clientX/clientY are in screen space, must be converted to canvas space
- Zoom operations multiply coordinate confusion (3+ coordinate systems)

**How to avoid:**
- Document coordinate system architecture clearly:
  ```
  Screen (CSS pixels) → Canvas (element pixels) → Logical (world units)
  Mouse click (clientX, clientY) → Canvas (x, y) → Normalized (0-1) → World (meters)
  ```
- Create explicit coordinate transformation functions:
  ```typescript
  screenToCanvas(screenX, screenY): {x, y}
  canvasToLogical(canvasX, canvasY): {x, y}
  logicalToCanvas(logicalX, logicalY): {x, y}
  ```
- Store transformation matrix with `ctx.getTransform()` and use `ctx.transformPoint()` for conversions
- Explicitly set both HTML attributes AND CSS for canvas:
  ```html
  <canvas width="1600" height="1200" style="width: 800px; height: 600px;">
  ```
- Subtract canvas.getBoundingClientRect() offset from mouse events before processing
- Use normalized coordinates (0-1) for storage to avoid coordinate system dependencies

**Warning signs:**
- Markers shift position when canvas resizes
- Mouse clicks are offset from visual marker positions
- Zoom-in causes markers to drift away from correct positions
- Transform reset issues: clearing canvas leaves artifacts
- Different coordinate values in storage vs display (e.g., marker at x=1200 displays at x=600)

**Phase to address:**
Phase 1 (Canvas Architecture) - Design coordinate system hierarchy from start. Phase 2 (Interaction Implementation) - Implement transformation functions and test thoroughly.

---

### Pitfall 10: Hit Detection Failures with Overlapping Objects

**What goes wrong:**
When using rectangle-based hit detection (bounding boxes), overlapping canvas objects cause false positives where users click on a lower visible object but the system detects a click on an overlapping object above it. Objects with transparent areas or irregular shapes register clicks on "empty" space within their bounding box. Antialiasing at object intersections creates completely opaque pixels that don't match either object's RGB values, breaking color-based hit detection. Small objects (resize handles, connection points) have tiny hit areas that are frustratingly difficult to click accurately.

**Why it happens:**
- Bounding box hit detection ignores actual pixel transparency
- Objects rendered in z-order but hit detection checks in storage order (mismatched)
- No concept of "click-through" for transparent regions
- Resize handles sized for visual appeal (8px) not usability (44px touch target)
- Mouse event coordinates not accounting for canvas transforms (zoom/pan)
- No tolerance/fuzziness in hit detection - requires pixel-perfect clicks

**How to avoid:**
- Implement layered hit detection with fallback strategies:
  1. Pixel-perfect check using color-based detection for irregular shapes
  2. Path-based detection using `isPointInPath()` or `isPointInStroke()`
  3. Bounding box as last resort for performance
- Use dedicated hidden canvas for hit detection:
  - Render each object with unique RGB color (object ID encoded)
  - On click, read pixel color from hidden canvas and decode ID
  - Handles overlapping, transparency, and irregular shapes correctly
- Enlarge hit areas beyond visual size:
  ```javascript
  // Visual size 8px, hit area 20px
  const hitArea = {x: visual.x - 6, y: visual.y - 6, w: 20, h: 20};
  ```
- For resize handles, use minimum 44x44px touch targets on mobile
- Apply canvas transform to mouse coordinates before hit testing:
  ```javascript
  const matrix = ctx.getTransform().inverse();
  const transformed = matrix.transformPoint(mouseX, mouseY);
  ```
- Add hover tolerance: detect when cursor is "near" object (within 5px)

**Warning signs:**
- Users complain "I clicked on X but Y was selected"
- Small UI elements (handles, buttons) require multiple click attempts
- Selection behavior changes unexpectedly when objects overlap
- Mouse clicks work on desktop but not on mobile/tablet
- Objects with transparent regions cannot be "un-selected" by clicking empty area

**Phase to address:**
Phase 2 (Canvas Interaction) - Implement basic hit detection with bounding boxes. Phase 3 (UX Polish) - Add pixel-perfect detection, larger touch targets, and hover states.

---

### Pitfall 11: Zoom/Pan Breaking Interactions

**What goes wrong:**
After implementing zoom and pan, previously working mouse interactions break. Dragging feels inconsistent - fast zoom makes small drags move objects huge distances. Panning after zoom causes view to "jerk" to new position instead of smooth continuation. Transform order mistakes (scale-then-translate vs translate-then-scale) cause zoom to orbit around origin (0,0) instead of cursor position. When drawing while canvas is zoomed, retrieved X/Y coordinates are incorrect because transforms aren't inverted. Canvas clearing artifacts appear when transform isn't reset before clearing.

**Why it happens:**
- Transform order matters: incorrect order causes unexpected behavior
  - Correct: `ctx.translate(panX, panY); ctx.scale(zoom, zoom)`
  - Wrong: `ctx.scale(zoom, zoom); ctx.translate(panX, panY)` - pan affected by zoom
- Pan delta not scaled: user drags 10 pixels, object moves 100 pixels at 10x zoom
- Zoom origin fixed at (0,0) instead of mouse cursor position
- Transform not reset before `clearRect()` causes partial clears
- Mouse coordinates not transformed by inverse matrix before processing
- Viewport bounds not recalculated after zoom/pan - culling breaks

**How to avoid:**
- Establish consistent transform order and document it:
  ```javascript
  // Always: translate then scale (zoom around translated point)
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  ```
- Scale pan deltas by zoom factor for consistency:
  ```javascript
  camera.x += mouseDelta.x / camera.zoom;
  camera.y += mouseDelta.y / camera.zoom;
  ```
- Implement zoom-to-cursor by adjusting pan during zoom:
  ```javascript
  // Zoom while keeping cursor world position constant
  const worldPoint = screenToWorld(mouseX, mouseY, oldZoom);
  camera.zoom = newZoom;
  camera.pan = adjustPanToKeepWorldPointUnderMouse(worldPoint, mouseX, mouseY);
  ```
- Always reset transform before clearing:
  ```javascript
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ```
- Transform mouse coordinates with inverse matrix:
  ```javascript
  const inverse = ctx.getTransform().inverse();
  const worldPos = inverse.transformPoint(mouseX, mouseY);
  ```

**Warning signs:**
- Zoom causes content to "fly off screen" instead of zooming in place
- Pan feels "sticky" or "slippery" at different zoom levels
- After panning, stopping and restarting causes view to jump
- Canvas clear leaves visual artifacts during zoom
- Mouse click positions offset from visual positions after zoom/pan
- Dragging objects behaves unpredictably at zoom levels other than 1.0

**Phase to address:**
Phase 2 (Zoom/Pan Implementation) - Get transform order correct from start. Phase 3 (Interaction Polish) - Fine-tune zoom-to-cursor and pan feel.

---

### Pitfall 12: Drag-and-Drop Edge Cases

**What goes wrong:**
Drag-and-drop breaks in edge cases: dragging object off-canvas continues to track mouse (object goes to extreme coordinates), dropping in invalid zones places object incorrectly, drag operations don't account for zoom/pan transforms, rapid mouse movements "lose" the dragged object, and multi-touch gestures conflict with drag operations. On mobile, default browser behaviors (scroll, context menu) interfere with drag. The dragleave event fires unexpectedly when entering child elements, and dragover events fire hundreds of times during a single drag creating performance issues.

**Why it happens:**
- Mouse events continue firing outside canvas bounds (no boundary checking)
- `preventDefault()` not called on drop event - browser default behavior takes over
- Drag delta not adjusted for zoom level (same as pan issue)
- Event throttling not implemented - dragover fires every few milliseconds
- Touch events and mouse events both fire on mobile - duplicate handling
- No validation of drop target - objects dropped into invalid locations
- Drag state not cleared on mouseup outside canvas

**How to avoid:**
- Clamp dragged object position to canvas bounds:
  ```javascript
  object.x = Math.max(0, Math.min(canvasWidth, object.x));
  object.y = Math.max(0, Math.min(canvasHeight, object.y));
  ```
- Always call `preventDefault()` on dragover and drop events:
  ```javascript
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => { e.preventDefault(); handleDrop(e); });
  ```
- Scale drag deltas by zoom factor:
  ```javascript
  const dx = (currentMouse.x - prevMouse.x) / camera.zoom;
  const dy = (currentMouse.y - prevMouse.y) / camera.zoom;
  ```
- Throttle dragover events to reduce CPU usage:
  ```javascript
  let lastDragTime = 0;
  if (Date.now() - lastDragTime > 16) { // ~60fps
    processDragOver();
    lastDragTime = Date.now();
  }
  ```
- Use Pointer Events API instead of separate mouse/touch handlers:
  ```javascript
  canvas.addEventListener('pointerdown', handlePointerDown);
  // Works for mouse, touch, and pen input
  ```
- Implement drop validation zones:
  ```javascript
  const dropZones = [{type: 'room', bounds: {...}}, ...];
  const validDrop = dropZones.find(zone => isPointInBounds(dropPoint, zone.bounds));
  if (!validDrop) { revertToOriginalPosition(); showError("Invalid drop location"); }
  ```
- Listen for mouseup on window, not just canvas:
  ```javascript
  window.addEventListener('mouseup', handleDragEnd); // Catches mouseup outside canvas
  ```
- Show visual feedback for valid/invalid drop zones (green highlight vs red/blocked cursor)

**Warning signs:**
- Objects "fly off screen" when dragged quickly
- Dropped objects end up in wrong positions after zoom/pan
- CPU spikes to 100% during drag operations
- On mobile, dragging triggers page scroll or context menu
- Drag state "stuck" - cursor shows drag mode even after releasing
- Objects can be dropped into walls, outside floor plan, or overlapping
- Multi-touch causes two objects to drag simultaneously

**Phase to address:**
Phase 2 (Drag Implementation) - Basic dragging with boundary checking and preventDefault(). Phase 3 (UX Polish) - Add drop validation, visual feedback, and mobile gesture handling.

---

### Pitfall 13: Undo/Redo State Management Nightmares

**What goes wrong:**
Undo/redo implemented as afterthought doesn't work reliably. Canvas doesn't have built-in undo like form inputs - developers must manually track all state changes. Naive implementations save entire canvas as image (toDataURL) for each change, consuming massive memory (1MB per snapshot for 1600x1200 canvas). Undo stack grows unbounded, causing memory leaks. Redo stack not cleared when new action performed after undo. Bulk operations (delete 50 markers) create 50 undo entries instead of 1. State serialization doesn't capture full context (zoom, pan, selection state). Undo/redo not designed from start - retrofitting requires refactoring entire application architecture.

**Why it happens:**
- Undo implemented late in development - all actions not centralized
- Storing canvas image data (base64) instead of object state (JSON)
- No command pattern - actions scattered across components
- State history unlimited - no max stack size enforcement
- Each individual change tracked instead of logical transactions
- Redo stack not invalidated on new action after undo
- Canvas operations (drawImage, fillRect) not easily reversible

**How to avoid:**
- Implement command pattern from start - all actions as reversible commands:
  ```typescript
  interface Command {
    execute(): void;
    undo(): void;
    redo(): void;
  }
  class MoveMarkerCommand implements Command {
    constructor(marker, oldPos, newPos) {...}
    execute() { marker.pos = newPos; render(); }
    undo() { marker.pos = oldPos; render(); }
  }
  ```
- Maintain separate undo/redo stacks with size limits:
  ```javascript
  const undoStack = []; // Max 100 items
  const redoStack = [];
  function executeCommand(cmd) {
    cmd.execute();
    undoStack.push(cmd);
    redoStack.length = 0; // Clear redo on new action
    if (undoStack.length > 100) undoStack.shift(); // Limit memory
  }
  ```
- Store object state (JSON) not canvas images:
  ```javascript
  // GOOD: {type: 'marker', id: 123, x: 0.5, y: 0.3} ~100 bytes
  // BAD: canvas.toDataURL() ~1MB
  ```
- Group related changes into transactions:
  ```javascript
  class CompositeCommand implements Command {
    constructor(commands) { this.commands = commands; }
    undo() { this.commands.reverse().forEach(cmd => cmd.undo()); }
  }
  // Delete 50 markers = 1 undo entry, not 50
  ```
- For libraries like Konva/FabricJS, use built-in serialization:
  ```javascript
  const state = canvas.toJSON(); // Efficient JSON representation
  ```
- Centralize all state mutations through command dispatcher
- Consider using Immer.js for immutable state snapshots (efficient memory)

**Warning signs:**
- Memory usage grows continuously during editing session
- Undo only works for some actions, not others
- Undo after redo clears redo stack unexpectedly
- Deleting 100 markers requires pressing Undo 100 times
- Undo doesn't restore zoom/pan/selection state
- Browser DevTools shows MB of base64 strings in memory
- Comment in code: "TODO: implement undo for this feature"

**Phase to address:**
Phase 1 (Architecture) - Design command pattern and state management. Phase 2 (Core Features) - Implement undo/redo for all actions from the start.

---

### Pitfall 14: Selection State Bugs (Multi-Select, Deselect, Click-Through)

**What goes wrong:**
Selection state becomes inconsistent: clicking empty canvas doesn't deselect, shift-click for multi-select broken, visual selection highlighting not synchronized with internal state, clicking "through" transparent areas selects wrong objects, no way to deselect last item, undo/redo doesn't restore selection state. Selection tools override OnCommit() to clear state but tons of code implicitly relies on this behavior (saving, deselect command, etc.). In systems without click-away deselection, users must manually deselect before performing other actions.

**Why it happens:**
- Selection state stored in multiple places (component state, selected object properties, UI state)
- Click event handler doesn't check if click hit any object - always selects/deselects
- Multi-select logic incomplete: shift-click toggles instead of adding to selection
- Selection rendering separate from selection state - gets out of sync
- No "background" object to click for deselection
- State transitions not clearly defined (idle → selecting → selected → deselecting)
- Undo/redo saves object state but not selection state

**How to avoid:**
- Maintain single source of truth for selection:
  ```javascript
  const selectionState = {
    selectedIds: new Set(),
    selectionRect: null,
    mode: 'normal' // 'normal' | 'adding' | 'removing'
  };
  ```
- Implement comprehensive click handling:
  ```javascript
  canvas.onClick = (e) => {
    const clickedObject = hitTest(e.x, e.y);
    if (!clickedObject) {
      clearSelection(); // Click on empty area = deselect all
    } else if (e.shiftKey) {
      toggleSelection(clickedObject); // Multi-select
    } else {
      setSelection([clickedObject]); // Single select (clears others)
    }
  };
  ```
- Synchronize visual state with selection state:
  ```javascript
  function render() {
    objects.forEach(obj => {
      drawObject(obj);
      if (selectionState.selectedIds.has(obj.id)) {
        drawSelectionHighlight(obj);
      }
    });
  }
  ```
- Support keyboard selection modifiers:
  - Click: select single, clear others
  - Shift+Click: toggle selection (add/remove)
  - Ctrl+Click: add to selection
  - Ctrl+A: select all
  - Escape: deselect all
- Include selection state in undo/redo:
  ```javascript
  class SelectCommand implements Command {
    constructor(newSelection, oldSelection) {...}
    undo() { restoreSelection(oldSelection); }
  }
  ```
- Render "background" layer to capture clicks on empty areas

**Warning signs:**
- Users report "can't deselect" or "clicking doesn't work"
- Selection highlight visible but object not actually selected (or vice versa)
- Shift-clicking selects one object instead of adding to selection
- Undo doesn't restore which items were selected
- Selection state persists across floor plan changes
- Clicking transparent part of image selects object underneath
- Selection behavior inconsistent between desktop and mobile

**Phase to address:**
Phase 2 (Selection Implementation) - Single source of truth, comprehensive click handling. Phase 3 (UX Polish) - Keyboard shortcuts, visual feedback, multi-select refinement.

---

### Pitfall 15: Touch/Mobile Gesture Conflicts

**What goes wrong:**
Touch gestures conflict with mouse events: both touch and mouse events fire simultaneously on mobile, causing duplicate actions. Default browser behaviors interfere: drag triggers page scroll, long-press shows context menu, pinch-zoom zooms entire page instead of canvas. Touch event coordinates in wrong coordinate system (page vs client vs offset). Passive event listener errors: "Unable to preventDefault inside passive event listener" in Chrome. No hover state on touch devices - tooltips and resize handles invisible. Touch targets too small (8px handles) - users frustrated by imprecise clicks.

**Why it happens:**
- iPad/mobile devices fire both touch AND mouse events for compatibility
- Developers test only on desktop with Chrome DevTools mobile emulation (doesn't show all issues)
- Modern browsers default to passive event listeners for performance - preventDefault() blocked
- Touch events have different structure: `e.touches[0]` instead of `e.clientX`
- CSS `touch-action: auto` allows browser to handle gestures (scroll, zoom, pan)
- No hover state on touch - features only shown on hover become inaccessible

**How to avoid:**
- Use Pointer Events API (unified interface for mouse/touch/pen):
  ```javascript
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  // Works for all input types, no duplication
  ```
- If using touch events, prevent mouse events from firing:
  ```javascript
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents corresponding mouse events
    handleTouchStart(e);
  }, {passive: false}); // Must explicitly set passive: false
  ```
- Disable browser touch behaviors with CSS:
  ```css
  canvas {
    touch-action: none; /* Disable browser pan/zoom/scroll */
    -webkit-user-select: none; /* Disable text selection */
  }
  ```
- Normalize event coordinates across input types:
  ```javascript
  function getEventCoords(e) {
    if (e.touches) {
      return {x: e.touches[0].clientX, y: e.touches[0].clientY};
    }
    return {x: e.clientX, y: e.clientY};
  }
  ```
- Enlarge touch targets (minimum 44x44px):
  ```javascript
  const isTouchDevice = 'ontouchstart' in window;
  const handleSize = isTouchDevice ? 44 : 8; // Larger on touch
  ```
- Replace hover-dependent features with tap/long-press alternatives:
  ```javascript
  // Desktop: hover shows tooltip
  // Mobile: tap shows tooltip, tap elsewhere hides
  ```
- Test on real devices - touch emulation doesn't catch all issues

**Warning signs:**
- Actions triggered twice on mobile (delete deletes 2 items)
- Console error: "Unable to preventDefault inside passive event listener"
- Page scrolls when user tries to pan canvas on mobile
- Pinch gesture zooms browser instead of canvas
- Resize handles invisible on iPad - users can't resize objects
- Users report "can't select small items on phone"
- Touch drag doesn't work but mouse drag works

**Phase to address:**
Phase 2 (Input Handling) - Use Pointer Events API, disable browser defaults. Phase 3 (Mobile UX) - Enlarge touch targets, test on real devices.

---

### Pitfall 16: Rotation Anchor Point Mistakes

**What goes wrong:**
Objects rotate around wrong point - furniture spins around center instead of corner, clock hands rotate around middle instead of base, rotation feels unnatural and disorienting. Developers apply rotation transform without setting rotation origin, causing objects to "swing wildly across screen" instead of pivoting in place. The default canvas rotation is around origin (0,0), not object center or custom anchor point. After rotation, object's bounding box changes, breaking hit detection and alignment operations.

**Why it happens:**
- Rotation transform defaults to origin (0,0) not object center
- Developers forget to translate to anchor point before rotating
- Transform order confusion: translate-rotate-translate vs rotate-translate
- Anchor point not configurable - hardcoded to center for all objects
- Bounding box calculation doesn't account for rotation
- Different objects need different anchor points (doors: hinge, hands: base, furniture: center)

**How to avoid:**
- Implement rotation around custom anchor point pattern:
  ```javascript
  function rotateObject(obj, angle, anchorX, anchorY) {
    ctx.save();
    ctx.translate(anchorX, anchorY);  // Move origin to anchor
    ctx.rotate(angle);                 // Rotate around anchor
    ctx.translate(-anchorX, -anchorY); // Move origin back
    drawObject(obj);
    ctx.restore();
  }
  ```
- Store anchor point with object metadata:
  ```javascript
  const furniture = {
    x: 100, y: 200,
    rotation: 0,
    anchorPoint: {x: 0.5, y: 0.5} // Center (normalized coords)
  };
  const clockHand = {
    rotation: 0,
    anchorPoint: {x: 0.5, y: 1.0} // Bottom center (base)
  };
  ```
- Calculate rotated bounding box for hit detection:
  ```javascript
  function getRotatedBounds(obj) {
    const corners = getCorners(obj);
    const rotated = corners.map(corner => rotatePoint(corner, obj.rotation, obj.anchor));
    return getBoundingBox(rotated);
  }
  ```
- Provide UI for setting custom anchor point:
  - Visual anchor point handle (draggable)
  - Presets: top-left, center, bottom-center, etc.
  - Snap to object edges and center
- Use libraries with built-in anchor point support:
  ```javascript
  // Konva.js
  shape.offsetX(shape.width() / 2); // Set rotation anchor
  shape.rotation(45);
  ```

**Warning signs:**
- Rotating furniture causes it to move across floor plan instead of rotating in place
- Doors don't pivot around hinge - swing through walls
- Rotation feels "wrong" or "unnatural" to users
- After rotation, clicking on object no longer selects it (bounding box wrong)
- Undo rotation doesn't return object to exact original position
- Some objects rotate correctly (rectangles) but others don't (irregular shapes)

**Phase to address:**
Phase 2 (Object Manipulation) - Implement correct rotation transforms with configurable anchor points from start.

---

### Pitfall 17: Copy/Paste Coordinate Offset Issues

**What goes wrong:**
Copy/paste places objects at wrong coordinates: pasted objects appear at original position (overlap with source), appear at origin (0,0), or appear off-screen. Transform matrix not applied correctly during paste - objects pasted at wrong zoom level appear giant or tiny. Clipboard contains absolute coordinates instead of relative offsets. Multiple paste operations (Ctrl+V repeatedly) create stack of objects at same position instead of offset cascade. Cross-floor-plan paste breaks when coordinate systems differ.

**Why it happens:**
- Clipboard stores absolute world coordinates instead of normalized/relative coords
- Paste operation doesn't offset coordinates from original
- Current viewport transform not considered during paste
- No "smart paste" logic - paste at cursor vs paste at original location
- Transform matrix e/f values (translation) not extracted correctly
- Normalized coordinates not converted back to current canvas space

**How to avoid:**
- Store clipboard data with metadata:
  ```javascript
  const clipboard = {
    objects: [...copiedObjects],
    sourceTransform: ctx.getTransform(), // Original zoom/pan
    copyCenter: getCenterPoint(copiedObjects), // For relative positioning
    timestamp: Date.now()
  };
  ```
- Implement paste with automatic offset:
  ```javascript
  function paste() {
    const offset = {x: 20, y: 20}; // Offset from original
    const pastedObjects = clipboard.objects.map(obj => ({
      ...obj,
      id: generateNewId(),
      x: obj.x + offset.x,
      y: obj.y + offset.y
    }));
    addObjects(pastedObjects);
  }
  ```
- Support paste-at-cursor (alternative to offset):
  ```javascript
  function pasteAtCursor(cursorPos) {
    const center = clipboard.copyCenter;
    const offsetX = cursorPos.x - center.x;
    const offsetY = cursorPos.y - center.y;
    // Paste with objects centered at cursor
  }
  ```
- Extract transform translation correctly:
  ```javascript
  const transform = ctx.getTransform();
  const translateX = transform.e; // Horizontal translation
  const translateY = transform.f; // Vertical translation
  ```
- Cascade multiple pastes:
  ```javascript
  let pasteCount = 0;
  function paste() {
    pasteCount++;
    const offset = {x: 20 * pasteCount, y: 20 * pasteCount};
    // Creates diagonal cascade of pasted objects
  }
  ```
- Normalize coordinates before copying, denormalize on paste:
  ```javascript
  function copy() {
    clipboard.objects = selectedObjects.map(obj => ({
      ...obj,
      x: obj.x / canvas.width,  // Normalize
      y: obj.y / canvas.height
    }));
  }
  function paste() {
    const objects = clipboard.objects.map(obj => ({
      ...obj,
      x: obj.x * canvas.width,   // Denormalize
      y: obj.y * canvas.height
    }));
  }
  ```

**Warning signs:**
- Pasted objects invisible (positioned off-screen)
- Paste creates exact overlap with original (no offset)
- Pasting after zoom creates tiny or huge objects
- Ctrl+V multiple times creates stack at same position
- Copy from one floor plan, paste to another - objects misaligned
- Paste coordinates don't account for current pan/zoom state

**Phase to address:**
Phase 2 (Copy/Paste Implementation) - Basic functionality with automatic offset. Phase 3 (UX Polish) - Paste-at-cursor, cascade, cross-floor-plan support.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store images as database BLOBs | Simple implementation, no file path management | Database bloat, slow queries, expensive storage, no CDN | Never for production; acceptable for prototypes with <10 images |
| Use pixel coordinates for markers | Simpler mental model initially | Cannot resize images, multi-resolution support impossible, migration painful | Never - normalized coords are equally simple |
| Skip UTF-8 BOM in CSV exports | Slightly smaller file size | Excel corruption, international character loss | Never - BOM adds 3 bytes, prevents data corruption |
| Hardcode SQL queries instead of ORM | Faster to write initially | Database migration nightmares, SQL injection risks | Never for production; acceptable for quick prototypes |
| Store database in OneDrive/cloud sync | Automatic "backups", easy sharing | Database corruption, data loss, support nightmares | Never - implement proper backup/sync instead |
| Single canvas layer for all rendering | Simpler rendering logic | Performance degrades with scale, everything redraws | Acceptable for MVP with <100 markers, migrate by Phase 3 |
| Skip calibration validation | Users can proceed faster | Systematic measurement errors, user frustration | Never - validation takes <5 seconds, prevents hours of issues |
| Store relative paths without base path | Works on developer machine | Breaks in production, backups, different machines | Acceptable for single-user local app, never for multi-user |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cloud Storage (S3/Azure) | Storing full URLs in database - URLs expire/change | Store object keys/paths; generate signed URLs on-demand |
| CSV Import/Export | Trusting Excel auto-detection | Export with UTF-8 BOM; import with encoding detection and preview |
| Image Processing | Processing large images on main thread | Use Web Workers or background processing; show progress indicators |
| Database Backups | Manual backup reminders to users | Automated scheduled backups; export functionality with validation |
| Multi-user Sync | Polling database every second for changes | Use WebSocket or Server-Sent Events for real-time updates |
| CAD File Import | Assuming all CAD files use same coordinate system | Detect coordinate system; provide calibration step during import |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Load all markers on page load | Slow initial load, high memory usage | Implement pagination or viewport-based loading | >500 markers or >5MB floor plan images |
| Full canvas redraw on every interaction | UI lag during pan/zoom, high CPU | Dirty flag pattern, layer separation, viewport culling | >200 markers with frequent interactions |
| Store all floor plans in memory | Fast switching between plans | Load on-demand, cache recently used | >50 floor plans or >100MB total image data |
| Synchronous image loading | UI freezes while loading | Async loading with loading indicators, progressive rendering | Floor plans >2MB or slow network |
| No database indexing | Slow queries as data grows | Index foreign keys, search fields, timestamp columns | >10,000 assets or >100 floor plans |
| Real-time sync with polling | Works for 1-10 users | WebSocket connections, server-sent events | >20 concurrent users |
| SQLite write concurrency | Single-user works fine | Migrate to PostgreSQL with proper locking | >5 concurrent writers |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No access control on floor plans | Unauthorized users view sensitive facility layouts | Implement role-based access control (RBAC), floor plan visibility levels |
| Store sensitive asset info without encryption | Data breach exposes asset values, locations | Encrypt sensitive fields (cost, serial numbers), use encrypted database |
| Allow unrestricted file uploads | Malicious files disguised as floor plan images | Validate file types (magic numbers, not extensions), scan for malware, size limits |
| No audit logging for asset changes | Cannot trace who moved/deleted valuable assets | Implement change log: who, what, when for all asset operations |
| Expose database file in web-accessible directory | Direct database download, data theft | Store database outside webroot, use application layer for all access |
| No session timeout on shared workstations | Unauthorized access to asset data | Implement idle timeout, require re-authentication for sensitive operations |
| Store floor plan images without access control | Sensitive facility layouts publicly accessible | Require authentication for image access, signed URLs with expiration |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Require perfect calibration before proceeding | Users frustrated, abandon setup | Allow approximate calibration, offer recalibration anytime |
| No undo for marker placement | Accidental clicks require deleting and re-creating | Implement undo/redo for all marker operations |
| Marker click targets too small on mobile | Cannot accurately select markers on touch screens | Touch targets ≥44x44px, show larger hit areas on mobile |
| No visual feedback during image upload | Users click "Upload" multiple times, duplicate uploads | Show progress bar, disable button during upload |
| Floor plan doesn't fit viewport on load | Users see blank screen, don't know to zoom out | Auto-fit floor plan to viewport on initial load |
| No search/filter with many assets | Users scroll through hundreds of markers | Implement search, filters (type, location, status), asset list view |
| Calibration UI doesn't show what distance means | Users confused about reference measurement | Show examples: "Distance between these doors is 3.5 meters" |
| No indication which floor plan is currently active | Users place markers on wrong floor | Highlight active floor plan, show breadcrumb navigation |
| Lost work when accidentally navigating away | User frustration, data loss | Auto-save drafts, warn before navigating with unsaved changes |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Floor Plan Upload:** Often missing image dimension validation, file size limits, format verification (actual image vs renamed .txt file) - verify by testing with corrupt files, 0-byte files, extremely large files

- [ ] **Scale Calibration:** Often missing sanity checks (e.g., 1 pixel = 1000 meters warning), recalibration workflow, calibration metadata storage - verify calibration survives app restart and shows correct scale ratio

- [ ] **Marker Placement:** Often missing collision detection (marker on top of marker), boundary validation (marker outside floor plan), coordinate normalization - verify markers stay positioned correctly across zoom levels and image resizes

- [ ] **CSV Export:** Often missing UTF-8 BOM, consistent quoting, Excel compatibility testing - verify by round-trip: export → open in Excel → edit → save → import, check for data corruption

- [ ] **CSV Import:** Often missing encoding detection, delimiter detection, preview before import, duplicate detection - verify with European CSV (semicolon), UTF-8 with special chars, malformed files

- [ ] **Database Migrations:** Often missing rollback scripts, data validation post-migration, backup before migration - verify by migrating production-size dataset, not just empty database

- [ ] **Multi-User Concurrency:** Often missing optimistic locking, conflict resolution UI, lost update detection - verify by simulating two users editing same asset simultaneously

- [ ] **Image Storage:** Often missing orphan file cleanup, broken path detection, storage quota management - verify database can be copied to new machine and images still load

- [ ] **Asset Search:** Often missing pagination for large result sets, relevance ranking, typo tolerance - verify performance with 10,000+ assets, search for partial matches

- [ ] **Undo/Redo:** Often missing for bulk operations, doesn't preserve full state (zoom, pan position), limited stack size - verify undo after 20+ operations, undo after app restart

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SQLite corruption in cloud folder | HIGH | 1. Stop cloud sync immediately. 2. Restore from last known good backup. 3. Move database to local folder. 4. Re-sync via application-level export/import, not file sync. 5. Educate users on storage location requirements. |
| Canvas performance degradation | MEDIUM | 1. Profile with DevTools to identify bottleneck. 2. Implement viewport culling as quick win. 3. Add layer separation for static vs dynamic content. 4. Consider WebGL migration for extreme scale. |
| Incorrect scale calibration | LOW | 1. Provide recalibration UI prominently. 2. Detect outliers: if 90% of floor plans have scale 50±10 pixels/meter, flag outliers. 3. Allow "copy calibration from similar floor plan". |
| CSV data corruption from Excel | MEDIUM | 1. Keep original import file as backup. 2. Implement diff detection: show what changed during import. 3. Allow reverting to pre-import state. 4. Provide Excel import guide in docs/UI. |
| Pixel coordinates on normalized system | HIGH | 1. Create migration script: detect image dimensions, convert pixel → normalized. 2. Test migration on copy of production DB. 3. Provide rollback script. 4. Run migration during maintenance window. |
| Poor database abstraction | HIGH | 1. Audit codebase for raw SQL queries. 2. Create abstraction layer incrementally. 3. Write integration tests against both databases. 4. Refactor in phases, not all at once. |
| Broken image file paths | MEDIUM | 1. Implement "Find Missing Images" tool. 2. Show thumbnails/previews where available. 3. Allow bulk re-linking. 4. Migrate to cloud storage to prevent future issues. |
| Incomplete asset data | LOW | 1. Generate data quality report. 2. Provide bulk edit UI. 3. Gamify completeness: "Complete 10 asset profiles to unlock analytics". 4. Set required fields for new assets. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SQLite corruption in cloud sync | Phase 1 (Setup/Architecture) | Programmatic detection of cloud sync paths; warning in setup wizard; documentation |
| Canvas performance degradation | Phase 2 (Basic Rendering), Phase 4 (Optimization) | Performance benchmarks: 60fps with 500 markers; profiling showing <16ms frame time |
| Inaccurate scale calibration | Phase 1 (Calibration UI), Phase 3 (Validation) | User testing: 90% can calibrate within 5% accuracy on first try |
| CSV data corruption | Phase 2 (Export), Phase 3 (Import Validation) | Round-trip test: export 1000 assets → Excel → import, verify 100% data integrity |
| Pixel vs normalized coordinates | Phase 1 (Data Model Design) | Unit tests: marker position stable across image resizes; zoom levels |
| Poor database abstraction | Phase 1 (Database Layer) | Integration tests passing against both SQLite and PostgreSQL |
| Broken image file paths | Phase 1 (Image Storage), Phase 4/5 (Cloud Migration) | Database can be copied to new machine; images load without re-linking |
| Incomplete asset tracking | Phase 2 (Asset CRUD), Phase 3 (Data Quality) | Data quality dashboard showing >80% profile completeness |

---

## Sources

**SQLite & Cloud Sync Issues:**
- [SQLite Database is locked · Issue #54 · skilion/onedrive](https://github.com/skilion/onedrive/issues/54)
- [Sqlite database corrupted prevents synchronization · Issue #688 · abraunegg/onedrive](https://github.com/abraunegg/onedrive/issues/688)
- [Access databases in OneDrive with Files on Demand enabled hang/pause - Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/4953248/access-databases-in-onedrive-with-files-on-demand)
- [How To Corrupt An SQLite Database File](https://www.sqlite.org/howtocorrupt.html)
- [How to use EF core sqlite with OneDrive? · Issue #30642 · dotnet/efcore](https://github.com/dotnet/efcore/issues/30642)

**Canvas Performance & Rendering:**
- [Optimising HTML5 Canvas Rendering: Best Practices and Techniques](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/)
- [Optimizing canvas - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [High Performance Map Interactions using HTML5 Canvas - ChairNerd](https://chairnerd.seatgeek.com/high-performance-map-interactions-using-html5-canvas/)
- [Performance optimization when adding 12,000+ markers to the map - DEV Community](https://dev.to/azyzz/performance-optimization-when-adding-12000-markers-to-the-map-that-renders-fast-with-elixir-liveview-and-leafletjs-54pf)
- [Google Maps V3: How to Render 1 Million+ Markers Efficiently](https://www.codelessgenie.com/blog/google-maps-v3-rendering-over-1-million-markers-in-a-reasonable-time/)

**Asset Management Pitfalls:**
- [Asset Management Challenges: Guide to Avoiding Costly Mistakes](https://ezo.io/ezofficeinventory/blog/asset-management-challenges/)
- [10 IT Asset Management Challenges [2025 Updated]](https://www.goworkwize.com/blog/it-asset-management-challenges)
- [Poor Asset Management: Challenges & Solutions | Infraon Blog 2025](https://infraon.io/blog/poor-asset-management/)
- [IT Asset Management Best Practices 2025 Guide — ASI Inc](https://www.asicorp.us/blog/it-asset-management-best-practices)
- [Consequences of Poor Asset Management: Avoid These Costly Mistakes](https://revnue.com/blog/consequences-of-poor-asset-management/)

**Spatial Calibration & Coordinate Systems:**
- [Geospatial Positioning Accuracy Standards PART 4](https://www.fgdc.gov/standards/projects/accuracy/part4/FGDC-endorsed-standard)
- [Accuracy Issues for Spatial Update of Digital Cadastral Maps](https://www.mdpi.com/2220-9964/11/4/221)
- [Coordinate Reference Systems: Ensuring Accuracy in Spatial Analysis | OHI](https://oceanhealthindex.org/news/crs_deep_dive/)
- [Two Point Calibration | Calibrating Sensors | Adafruit Learning System](https://learn.adafruit.com/calibrating-sensors/two-point-calibration)
- [Normalized camera / image coordinates - OpenCV Q&A Forum](https://answers.opencv.org/question/83807/normalized-camera-image-coordinates/)

**CSV Export/Import Issues:**
- [10 Common CSV Errors and Fundamental CSV Limits | Row Zero](https://rowzero.com/blog/common-csv-errors)
- [Why Excel's built-in CSV functionality corrupts your data | POWER CSV](https://powercsv.com/blog/why-excel-corrupts-your-csv-data/)
- [How to Export CSV Files from Excel: Encoding Fixes - Excel Operations](https://exceloperations.com/how-to-export-csv-files-from-excel-save-steps-encoding-fixes-and-zero-loss-prevention/)
- [6 Common CSV Import Errors and How to Fix Them | Flatfile](https://flatfile.com/blog/top-6-csv-import-errors-and-how-to-fix-them/)
- [Common Pitfalls in CSV and How to Avoid Them](https://www.companysconnects.com/post/common-pitfalls-in-csv-and-how-to-avoid-them)

**Database Migration & Abstraction:**
- [How to migrate from SQLite to PostgreSQL](https://render.com/articles/how-to-migrate-from-sqlite-to-postgresql)
- [SQLite to PostgreSQL Migration Guide 2025 | Tools & Tips](https://www.nihardaily.com/93-how-to-convert-sqlite-to-postgresql-step-by-step-migration-guide-for-developers)
- [Migrating from SQLite to PostgreSQL - Using the ORM - Django Forum](https://forum.djangoproject.com/t/migrating-from-sqlite-to-postgresql/29128)
- [Database Migration: SQLite to PostgreSQL](https://www.bytebase.com/blog/database-migration-sqlite-to-postgresql/)

**Image Storage Patterns:**
- [Storing Images: Database vs Filesystem – Pros, Cons & Best Practices](https://www.codegenes.net/blog/storing-images-in-a-database-versus-a-filesystem/)
- [Database vs Filesystem: Should You Store Images as BLOBs? - NextStruggle](https://www.nextstruggle.com/database-vs-filesystem-should-you-store-images-as-blobs/askdushyant/)
- [Databases vs Blob Storage: What to Use and When | by Harshith Gowda | Medium](https://medium.com/@harshithgowdakt/databases-vs-blob-storage-what-to-use-and-when-d5b1ec0d11cd)

**Concurrency & Scaling:**
- [Database Locking: A Comprehensive Guide for 2025 - Shadecoder](https://www.shadecoder.com/topics/database-locking-a-comprehensive-guide-for-2025)
- [Database Concurrency Conflicts in the Real World](https://www.codemag.com/article/0607081/Database-Concurrency-Conflicts-in-the-Real-World)
- [Concurrency Control in Databases | by AkashSDas | Medium](https://medium.com/@akashsdas_dev/concurrency-control-in-databases-a3fa7c186aab)

---

*Pitfalls research for: Visual Asset Management & Floor Plan Visualization*
*Researched: 2026-01-28*
