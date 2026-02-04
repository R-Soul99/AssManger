# Phase 4: Floor Plan Management - Research

**Researched:** 2026-02-04
**Domain:** Image file import, card-based list UI, drag-to-reorder, deletion safety dialogs, Tauri file I/O
**Confidence:** HIGH

## Summary

Phase 4 builds on a substantial foundation already in place: the `FloorPlan` domain entity, `IFloorPlanRepository` interface, `SqliteFloorPlanRepository` implementation, `floor_plans` table with schema and relations, and `LocalFileStorage` service for relative-path image management are ALL already implemented from Phase 1. The schema also already has the `markers` table with a foreign key to `floor_plans`, which is the basis for the "warn on delete" requirement.

What Phase 4 adds is the **presentation and orchestration layer**: the import workflow (file dialog + image processing + save), the card-based list view with location-grouped display, the detail/edit view, drag-to-reorder within a floor, and bulk delete with per-plan marker warnings.

Three key technical decisions need to be made before planning:
1. **Image format handling** -- PNG and JPEG work natively in browsers. BMP also decodes natively via `<canvas>`. TIFF requires a JS library (`tiff.js`). PDF rasterization requires a native backend call (Rust crate) and is high-complexity. Recommendation: support PNG/JPEG/BMP natively via canvas conversion; add TIFF via `tiff.js`; drop PDF from this phase or make it a stretch goal behind a "PDF requires additional setup" warning.
2. **Drag-to-reorder** -- requires a `display_order` column added to `floor_plans` via a Drizzle migration, and `@dnd-kit/sortable` for the UI. This is trivial to add.
3. **Navigation** -- The current App.tsx uses toggle-button state (not a router). Floor Plans should follow the same pattern: a "Manage Floor Plans" toggle button alongside Assets/Categories/Locations.

**Primary recommendation:** Use `@dnd-kit/sortable` for reorder, canvas-based conversion for BMP (no extra dependency), `tiff.js` for TIFF, defer PDF to a later phase. Add a `display_order` INTEGER column to `floor_plans` via migration. Follow the same component structure as the asset module (main list component, detail view component, service layer, mock repo for dev).

---

## What Already Exists (Do Not Rebuild)

This section documents code that is ALREADY SHIPPED and must be USED, not reimplemented.

### Domain Layer -- COMPLETE
- **`src/domain/entities/FloorPlan.ts`** -- Entity class with `id`, `name`, `locationId`, `imageRelativePath`, `imageWidth`, `imageHeight`, `createdAt`, `updatedAt`. Has `getAspectRatio()` method. Validates via `FloorPlanSchema`.
- **`src/domain/validators/schemas.ts`** -- `FloorPlanSchema` (Zod): requires `id` (uuid), `name` (min 1), `locationId` (uuid), `imageRelativePath` (min 1), `imageWidth` (positive int), `imageHeight` (positive int), dates.
- **`src/domain/entities/Location.ts`** -- Has `canHaveChildType()` for hierarchy validation. Hierarchy: site > building > floor > room. Floor plans attach to `floor` locations (locationId references a floor-type location).

### Infrastructure Layer -- COMPLETE
- **`src/infrastructure/database/schema.ts`** -- `floorPlans` table defined with all columns. Relations defined: `floorPlansRelations` links to `locations` (one), `markers` (many), `calibrations` (one). The `markers` table has `ON DELETE CASCADE` from `floor_plans`.
- **`src/infrastructure/repositories/interfaces/IFloorPlanRepository.ts`** -- Interface with: `findById`, `findAll`, `findByLocation`, `save`, `update`, `delete`, `hasMarkers`, `getMarkerCount`. All methods needed for Phase 4 CRUD and delete-safety checks are present.
- **`src/infrastructure/repositories/sqlite/SqliteFloorPlanRepository.ts`** -- Full SQLite implementation of the interface. Uses Drizzle ORM. `hasMarkers` and `getMarkerCount` query the `markers` table.
- **`src/infrastructure/repositories/RepositoryFactory.ts`** -- Already registers `getFloorPlanRepository()`. NOTE: it throws if `db` is null (no mock fallback). A `MockFloorPlanRepository` will need to be created for dev/checkpoint mode (see below).
- **`src/infrastructure/storage/LocalFileStorage.ts`** -- Singleton `localFileStorage`. Has: `initialize(config)`, `saveFloorPlanImage(sourcePath, fileName)` (copies file, returns relative path like `floor_plans/filename.png`), `getAbsolutePath(relativePath)`, `imageExists(relativePath)`, `deleteImage(relativePath)`, `listImages()`. Sanitizes filenames, generates unique names on collision.
- **`src/infrastructure/database/connection.ts`** -- `withTransaction()` available for atomic multi-statement operations.

### Migration History
- 4 migrations already applied (0000 through 0003). The `floor_plans` table was created in migration `0000_sparkling_caretaker`. A new migration (0004) will be needed to add `display_order`.
- Migration generation: `npm run db:generate` (drizzle-kit generate). Migrations live in `drizzle/migrations/`.

### Tauri Permissions -- Already Granted
The `src-tauri/capabilities/default.json` already includes:
- `dialog:allow-open` -- for the import file picker
- `fs:allow-read-file` -- for reading selected image files
- `fs:allow-copy-file` -- for copying images to the project's `floor_plans/` directory
- `fs:allow-write-file` -- for writing converted images
- `fs:allow-mkdir` -- for creating the `floor_plans/` subdirectory
- `fs:allow-exists` -- for checking file existence

No Tauri permission changes needed for Phase 4.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | 7.3.7 | Card, Dialog, Grid, form components | Already established; Card component handles thumbnails and text layout |
| @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities | latest (install fresh) | Drag-to-reorder cards within a floor | Actively maintained, lightweight, keyboard-accessible. `react-beautiful-dnd` is deprecated. |
| @tauri-apps/plugin-dialog | 2.6.0 | File open dialog for image import | Already installed and permitted |
| @tauri-apps/plugin-fs | 2.4.5 | Read selected image, copy to project dir | Already installed and permitted |
| @tauri-apps/api/path | 2.9.1 | Path joining for relative path resolution | Already used by LocalFileStorage |
| tiff.js | ~4.0 | Decode TIFF images in-browser | Browsers do not natively decode TIFF in canvas; this is the lightest decoder |
| react-hook-form | 7.71.1 | Form state in detail/edit view | Already installed and used in AssetDetailDrawer |
| zod | 4.3.6 | Schema validation | Already installed; FloorPlanSchema already defined |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uuid | 13.0.0 | Generate IDs for new floor plans | Already used in AssetService and LocationService |

### What NOT to Install
| Tempting Library | Why Skip |
|------------------|----------|
| pdf.js / pdfminer | PDF rasterization in a Tauri app requires native backend (Rust FFI to Poppler/MuPDF). pdf.js can render PDFs but cannot rasterize to image blobs in all cases without canvas security restrictions. Defer PDF to a dedicated phase. |
| react-beautiful-dnd | Deprecated by Atlassian in 2022. Use dnd-kit instead. |
| pica (image resizing) | Canvas `drawImage()` with target dimensions handles resize. pica adds worker-based quality but is overkill for thumbnail generation. |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities tiff.js
```

---

## Architecture Patterns

### Recommended Component Structure
```
src/presentation/components/floorplan/
  FloorPlanList.tsx            # Main view: grouped card grid, import button, bulk actions
  FloorPlanCard.tsx            # Single card: thumbnail, location path, name, marker count
  FloorPlanDetailView.tsx      # Full-page or modal detail/edit form
  FloorPlanImportDialog.tsx    # Multi-step: file picker -> preview -> location assign -> save
  FloorPlanDeleteWarning.tsx   # Per-plan warning dialog (steps through affected plans)
  index.ts                     # Barrel export
src/application/services/
  FloorPlanService.ts          # Orchestrates: import, CRUD, delete-with-check, reorder
```

### Pattern 1: Location-Grouped Card Grid
**What:** Cards grouped by site > building > floor hierarchy. Each section header shows the hierarchy path.
**When to use:** The CONTEXT specifies card-based layout with location path displayed. Grouped sections match the existing LocationTreeView pattern.
**How:** Load all floor plans via `findAll()`. Load all locations via `locationRepo.findAll()`. Build a location map. Group floor plans by their `locationId`. For each group, resolve the full path (site > building > floor) using the same `buildLocationPath` traversal pattern used in `SqliteAssetRepository`.

```typescript
// Pattern: group floor plans by location, resolve path
interface FloorPlanGroup {
  locationPath: string; // "HQ > Main Building > Ground Floor"
  locationId: string;
  plans: FloorPlan[];
}

function groupFloorPlansByLocation(
  plans: FloorPlan[],
  locations: LocationData[]
): FloorPlanGroup[] {
  const locationMap = new Map(locations.map(l => [l.id, l]));
  const groups = new Map<string, FloorPlan[]>();

  for (const plan of plans) {
    const existing = groups.get(plan.locationId) || [];
    existing.push(plan);
    groups.set(plan.locationId, existing);
  }

  return Array.from(groups.entries()).map(([locationId, plans]) => ({
    locationId,
    locationPath: buildPath(locationId, locationMap),
    plans,
  }));
}

function buildPath(locationId: string, locationMap: Map<string, LocationData>): string {
  const parts: string[] = [];
  let current: LocationData | undefined = locationMap.get(locationId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? locationMap.get(current.parentId) : undefined;
  }
  return parts.join(' > ');
}
```

### Pattern 2: Image Import via Canvas Conversion
**What:** User selects image file. Read as ArrayBuffer via Tauri `readFile`. Decode via `<canvas>` (handles PNG, JPEG, BMP natively). For TIFF, use `tiff.js` to decode first. Resize if over a max dimension. Convert to PNG blob. Write PNG to project `floor_plans/` directory. Store relative path in DB.
**When to use:** All image import flows.

```typescript
// Canvas-based image load + optional resize + format conversion
async function loadAndConvertImage(
  fileData: Uint8Array,
  mimeType: string,
  fileName: string
): Promise<{ blob: Blob; width: number; height: number; outputName: string }> {
  const MAX_DIMENSION = 4096; // Auto-resize if either dimension exceeds this

  let imageBitmap: ImageBitmap;

  if (mimeType === 'image/tiff' || fileName.toLowerCase().endsWith('.tif') || fileName.toLowerCase().endsWith('.tiff')) {
    // TIFF: decode via tiff.js, then create ImageBitmap from the decoded RGBA buffer
    const tiff = await import('tiff.js');
    const decoded = tiff.decode(fileData.buffer);
    // decoded gives width, height, data (Uint8Array RGBA)
    // Create an ImageData and render to canvas
    const canvas = document.createElement('canvas');
    canvas.width = decoded.width;
    canvas.height = decoded.height;
    const ctx = canvas.getContext('2d')!;
    const imageData = new ImageData(new Uint8ClampedArray(decoded.data), decoded.width, decoded.height);
    ctx.putImageData(imageData, 0, 0);
    imageBitmap = await createImageBitmap(canvas);
  } else {
    // PNG, JPEG, BMP: browser decodes natively
    const blob = new Blob([fileData], { type: mimeType });
    imageBitmap = await createImageBitmap(blob);
  }

  // Resize if needed (maintain aspect ratio)
  let drawWidth = imageBitmap.width;
  let drawHeight = imageBitmap.height;
  if (drawWidth > MAX_DIMENSION || drawHeight > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / drawWidth, MAX_DIMENSION / drawHeight);
    drawWidth = Math.round(drawWidth * scale);
    drawHeight = Math.round(drawHeight * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = drawWidth;
  canvas.height = drawHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageBitmap, 0, 0, drawWidth, drawHeight);

  // Always output as PNG (normalizes BMP/TIFF/JPEG to single format for consistency)
  const outputBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });

  // Derive output filename: replace extension with .png
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const outputName = `${baseName}.png`;

  return { blob: outputBlob, width: drawWidth, height: drawHeight, outputName };
}
```

### Pattern 3: Drag-to-Reorder with dnd-kit
**What:** Cards within the same floor group are drag-reorderable. On drop, update `display_order` in the database.
**When to use:** Within each location group on the FloorPlanList.

```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Each FloorPlanCard becomes a SortableItem:
function SortableFloorPlanCard({ plan, locationPath, markerCount }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: plan.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FloorPlanCard plan={plan} locationPath={locationPath} markerCount={markerCount} />
    </div>
  );
}

// In FloorPlanList, each group gets its own DndContext:
function FloorPlanGroup({ group, onReorder }: { group: FloorPlanGroup; onReorder: (locationId: string, newOrder: string[]) => void }) {
  const ids = group.plans.map(p => p.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over!.id as string);
      const newIds = arrayMove(ids, oldIndex, newIndex);
      onReorder(group.locationId, newIds);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {group.plans.map((plan, idx) => (
          <SortableFloorPlanCard key={plan.id} plan={plan} ... />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 4: Per-Plan Bulk Delete with Marker Warnings
**What:** When bulk deleting floor plans, step through each plan that has markers one-by-one in a confirmation dialog. Plans without markers are deleted immediately after overall confirmation.
**When to use:** Bulk delete action.
**How:** Before deleting, call `hasMarkers(id)` for each selected plan. Separate into `plansWithMarkers` and `plansWithoutMarkers`. Show a stepped dialog: "Plan X has N markers. Delete anyway? [Skip] [Delete] [Cancel All]". After stepping through all warned plans, delete the confirmed set sequentially (same pattern as Phase 3 bulk delete: sequential loop for SQLite write safety).

```typescript
// State machine for stepped deletion
type DeletePhase =
  | { step: 'confirm-bulk'; count: number }           // Initial "delete N plans?" confirmation
  | { step: 'warn-markers'; planIndex: number; plans: { plan: FloorPlan; count: number }[] } // Per-plan warning
  | { step: 'deleting'; progress: number }            // Deletion in progress
  | { step: 'idle' };                                 // No dialog open

// On each "Delete" click in warn-markers step, add plan to confirmed list.
// On "Skip", remove from confirmed list but advance to next warning.
// On "Cancel All", close dialog, delete nothing.
// After all warnings stepped through, proceed to 'deleting' phase.
```

### Anti-Patterns to Avoid
- **Do not use a single combined warning for bulk delete** -- CONTEXT explicitly requires per-plan stepping. A single "N plans have markers, are you sure?" dialog violates the user's requirement.
- **Do not store image blobs in SQLite** -- Images are stored as files on disk; only relative paths go in the database. This is the established pattern from Phase 1.
- **Do not skip the canvas normalization step for BMP** -- BMP files from `readFile` cannot be written directly as PNG. Always pass through canvas.
- **Do not assign locationId as required during import** -- CONTEXT says location is assigned AFTER import. The initial save uses a placeholder or empty state. The FloorPlanSchema requires locationId (uuid), so either use a sentinel value OR temporarily relax validation for the "unassigned" state. See Open Questions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-reorder | Custom HTML5 DnD with mousedown/mousemove | `@dnd-kit/sortable` | HTML5 DnD API has terrible mobile support, no keyboard accessibility, no animation. dnd-kit handles all of this. |
| TIFF decoding | Custom TIFF parser | `tiff.js` | TIFF format has dozens of compression schemes (LZW, PackBits, deflate, JPEG). Parsing is not trivial. |
| Image resize | Manual pixel-by-pixel downsampling | Canvas `drawImage()` with target dimensions | Browser's canvas scaling is GPU-accelerated and handles interpolation. |
| File name collision | Custom counter logic | `LocalFileStorage.generateUniqueName()` | Already implemented with proper collision detection. |
| Location path string | Manual traversal every render | Cache paths at load time (same pattern as SqliteAssetRepository.buildLocationPath) | Path traversal is O(depth) per plan. With 50+ plans, doing it on every render adds up. Compute once on data load. |
| Unique ID generation | Custom ID scheme | `uuid` v4 (already in devDependencies) | Already used project-wide. Consistency matters for Zod uuid() validation. |
| Reorder persistence | Optimistic update without DB call | Always persist reorder to DB via sequential update loop | SQLite is the source of truth. If app crashes between reorder and persist, user loses changes. |

**Key insight:** The heaviest work in this phase (entity, repo, schema, file storage, permissions) is already done. The phase is primarily UI orchestration and a thin service layer on top of existing infrastructure.

---

## Schema Change: display_order Column

The `floor_plans` table needs a `display_order` INTEGER column for drag-to-reorder persistence.

**Add to `schema.ts`:**
```typescript
export const floorPlans = sqliteTable('floor_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  imageRelativePath: text('image_relative_path').notNull(),
  imageWidth: integer('image_width').notNull(),
  imageHeight: integer('image_height').notNull(),
  displayOrder: integer('display_order').notNull().default(0),  // <-- NEW
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

**Generate migration:** `npm run db:generate` -- produces migration 0004.

**Update FloorPlanSchema** in `schemas.ts` to include `displayOrder: z.number().int().default(0)`.

**Update FloorPlan entity** to expose `displayOrder` getter.

**Update IFloorPlanRepository** to add `reorder(locationId: string, orderedIds: string[]): Promise<void>`.

**Update SqliteFloorPlanRepository** to implement `reorder` using sequential updates within a transaction.

**Update SqliteFloorPlanRepository.findByLocation** to `ORDER BY display_order ASC`.

---

## Common Pitfalls

### Pitfall 1: BMP Files Fail to Load via Image Element
**What goes wrong:** Developer tries `new Image(); img.src = URL.createObjectURL(bmpBlob)`. Works in Chrome, fails in Firefox/Safari.
**Why it happens:** BMP support in `<img>` and `createImageBitmap` is inconsistent across browsers. Tauri uses a system WebView (Chromium on Windows, WebKit on macOS).
**How to avoid:** Always decode via canvas: create a Blob with correct MIME type (`image/bmp`), use `createImageBitmap(blob)`, draw to canvas, export as PNG. Test on the target platform.
**Warning signs:** Works in dev, fails in production Tauri build on a different OS.

### Pitfall 2: TIFF Decoding Returns Wrong Color Channels
**What goes wrong:** TIFF images appear green-tinted or have swapped R/B channels.
**Why it happens:** Some TIFF encoders use BGR channel order. `tiff.js` returns raw pixel data without guaranteed RGBA ordering for all compression types.
**How to avoid:** Verify the decoded data matches expected RGBA order. Test with a known TIFF file. Most engineering floor plans are grayscale or simple RGB, so this is unlikely to be a real-world problem, but flag it in testing.
**Warning signs:** Color corruption visible on first load of a TIFF file.

### Pitfall 3: Placeholder locationId Fails Zod Validation
**What goes wrong:** CONTEXT says location is assigned after import. But `FloorPlanSchema` requires `locationId` to be a valid UUID. Saving with an empty string or null fails validation.
**Why it happens:** The schema was designed assuming location is always assigned at creation time.
**How to avoid:** Two options: (A) Make `locationId` optional in the schema (change to `z.string().uuid().optional()`) and handle null in the DB (requires schema change). (B) Require the user to select a location in the import dialog before saving -- this contradicts CONTEXT but is simpler. Recommendation: Use option (A). Add `locationId` as nullable in both schema and DB. This matches the CONTEXT requirement and is a small, contained change. See Open Questions for details.
**Warning signs:** Import button works but save fails with validation error.

### Pitfall 4: Reorder State Desynchronizes from DB
**What goes wrong:** User drags card to new position. UI updates immediately (optimistic). Network/DB call fails silently. Next page load shows old order.
**Why it happens:** Optimistic update without error handling.
**How to avoid:** Persist reorder synchronously (better-sqlite3 is synchronous, so the Drizzle call is effectively instant for local SQLite). If it throws, catch the error and revert the UI state to the previous order.
**Warning signs:** Reorder "works" visually but doesn't survive a page refresh.

### Pitfall 5: Image Thumbnail Renders at Wrong Aspect Ratio
**What goes wrong:** Floor plan thumbnail in card is stretched or squished.
**Why it happens:** Card thumbnail area has fixed dimensions but image has arbitrary aspect ratio.
**How to avoid:** Use CSS `object-fit: contain` on the `<img>` element within a fixed-size container. The FloorPlan entity already has `getAspectRatio()` -- use this for layout calculations if needed.
**Warning signs:** Circular buildings, stretched rectangles in thumbnails.

### Pitfall 6: Sequential Delete Loop Hangs on Large Selection
**What goes wrong:** User bulk-selects 200 floor plans. Sequential delete loop takes 5+ seconds. UI appears frozen.
**Why it happens:** Each delete is a separate DB transaction. SQLite serializes writes.
**How to avoid:** Same pattern as Phase 3 (AssetBulkActions): show a CircularProgress indicator during the delete loop. The loop itself should remain sequential per the Phase 3 decision (03-03: "Sequential delete loop in bulk actions for SQLite write safety").
**Warning signs:** UI freezes during bulk delete, no feedback to user.

### Pitfall 7: File Dialog Returns URI on Some Platforms
**What goes wrong:** `open()` returns a file path on Windows/macOS but a `file://` URI on Linux or content URI on Android.
**Why it happens:** Tauri's dialog plugin returns platform-native paths. The `readFile` function expects a path, not a URI.
**How to avoid:** On desktop (Windows/macOS/Linux), the return is a plain path string. Tauri 2 desktop targets consistently return paths. Since this is a desktop app, this is not a practical concern -- but do not assume the return value starts with a drive letter; it could be a Unix path if cross-compiled.
**Warning signs:** `readFile` throws "file not found" immediately after successful file selection.

---

## Code Examples

### Reading a User-Selected Image File in Tauri
```typescript
// Source: https://v2.tauri.app/plugin/dialog/ and https://tauri.app/reference/javascript/fs/
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';

async function pickFloorPlanImage(): Promise<{ data: Uint8Array; fileName: string } | null> {
  const filePath = await open({
    multiple: false,
    filters: [{
      name: 'Floor Plan Images',
      extensions: ['png', 'jpeg', 'jpg', 'bmp', 'tif', 'tiff'],
      // Note: PDF intentionally excluded from this phase
    }],
  });

  if (!filePath) return null; // User cancelled

  const data = await readFile(filePath as string);
  const fileName = await basename(filePath as string);

  return { data: new Uint8Array(data), fileName };
}
```

### Saving Converted Image via LocalFileStorage
```typescript
// Source: src/infrastructure/storage/LocalFileStorage.ts (existing code)
import { writeFile } from '@tauri-apps/plugin-fs';
import { localFileStorage } from '@/infrastructure/storage/LocalFileStorage';

async function saveProcessedImage(blob: Blob, outputName: string): Promise<string> {
  // Convert blob to Uint8Array
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // Get the target directory from LocalFileStorage
  const floorPlansDir = await localFileStorage.getFloorPlansDirectory();
  // Note: LocalFileStorage.saveFloorPlanImage expects a sourcePath (copies from there).
  // For in-memory blobs, write directly to the target path instead:
  const { join } = await import('@tauri-apps/api/path');

  // Generate unique name (reuse the collision logic -- or call saveFloorPlanImage if
  // we first write the blob to a temp location). Simplest: write directly.
  const targetPath = await join(floorPlansDir, outputName);
  await writeFile(targetPath, uint8);

  // Return relative path for DB storage
  return `floor_plans/${outputName}`;
}
```

### MUI Card for Floor Plan Thumbnail
```typescript
// Source: MUI Card docs pattern (https://mui.com/material-ui/react-card/)
import { Card, CardMedia, CardContent, Typography, Box, Chip } from '@mui/material';

interface FloorPlanCardProps {
  plan: FloorPlan;
  locationPath: string;
  markerCount: number;
  onClick: () => void;
}

const FloorPlanCard: React.FC<FloorPlanCardProps> = ({ plan, locationPath, markerCount, onClick }) => (
  <Card
    onClick={onClick}
    sx={{ cursor: 'pointer', width: 280, '&:hover': { boxShadow: 4 } }}
  >
    <CardMedia
      component="img"
      height="160"
      image={plan.imageUrl} // Resolved absolute path converted to file:// or data: URL
      alt={plan.name}
      sx={{ objectFit: 'contain', backgroundColor: 'grey.100' }}
    />
    <CardContent>
      <Typography variant="body2" color="text.secondary" noWrap>
        {locationPath}
      </Typography>
      <Typography variant="h6" component="h3" sx={{ mt: 0.5 }}>
        {plan.name}
      </Typography>
      {markerCount > 0 && (
        <Chip label={`${markerCount} marker${markerCount !== 1 ? 's' : ''}`} size="small" color="primary" sx={{ mt: 1 }} />
      )}
    </CardContent>
  </Card>
);
```

### Displaying Images from Relative Paths in Tauri
```typescript
// Tauri WebView cannot load file:// URLs directly via <img src>.
// Solution: read the file via plugin-fs, convert to data URL, use as src.

import { readFile } from '@tauri-apps/plugin-fs';
import { localFileStorage } from '@/infrastructure/storage/LocalFileStorage';

async function resolveImageUrl(relativePath: string): Promise<string> {
  const absolutePath = await localFileStorage.getAbsolutePath(relativePath);
  const fileData = await readFile(absolutePath);
  const blob = new Blob([new Uint8Array(fileData)], { type: 'image/png' });
  return URL.createObjectURL(blob);
  // IMPORTANT: Call URL.revokeObjectURL(url) when the component unmounts to prevent memory leaks
}
```

---

## MockFloorPlanRepository -- Needed for Dev

The `RepositoryFactory.getFloorPlanRepository()` currently throws if no DB connection exists (unlike Location/Asset/Category repos which fall back to mocks). A `MockFloorPlanRepository` must be created following the same pattern as `MockLocationRepository`:

```typescript
// src/infrastructure/repositories/mock/MockFloorPlanRepository.ts
import { FloorPlan } from '@/domain/entities';
import type { FloorPlanData } from '@/domain/validators';
import type { IFloorPlanRepository } from '../interfaces/IFloorPlanRepository';

export class MockFloorPlanRepository implements IFloorPlanRepository {
  static store: FloorPlanData[] = [
    {
      id: 'bbbbbbbb-cccc-4ddd-8eee-000000000001',
      name: 'Ground Floor Plan',
      locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003', // Ground Floor from MockLocationRepository
      imageRelativePath: 'floor_plans/ground_floor.png',
      imageWidth: 1200,
      imageHeight: 800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  // ... implement all interface methods against static store
}
```

Register in `RepositoryFactory.getFloorPlanRepository()`:
```typescript
getFloorPlanRepository(): IFloorPlanRepository {
  if (!this.floorPlanRepo) {
    this.floorPlanRepo = this.db
      ? new SqliteFloorPlanRepository(this.db)
      : new MockFloorPlanRepository();
  }
  return this.floorPlanRepo;
}
```

---

## FloorPlanService -- Design

The service follows the same pattern as `AssetService` and `LocationService`: constructor-injected repository, returns `ServiceResult<T>`, uses `uuid` for ID generation.

```typescript
// src/application/services/FloorPlanService.ts

export interface ImportFloorPlanDto {
  name?: string;           // Optional; defaults to source filename (without extension)
  locationId?: string;     // Optional at import time; assigned later via updateFloorPlan
  imageData: Uint8Array;   // Raw file bytes
  fileName: string;        // Original file name (used for extension detection and default name)
}

export interface UpdateFloorPlanDto {
  name?: string;
  locationId?: string;
}

export class FloorPlanService {
  constructor(private floorPlanRepo: IFloorPlanRepository) {}

  async importFloorPlan(dto: ImportFloorPlanDto): Promise<ServiceResult<FloorPlan>> { ... }
  async updateFloorPlan(id: string, dto: UpdateFloorPlanDto): Promise<ServiceResult> { ... }
  async deleteFloorPlan(id: string): Promise<ServiceResult> { ... }
  async bulkDeleteFloorPlans(ids: string[]): Promise<ServiceResult<{ deleted: string[]; skipped: string[] }>> { ... }
  async reorderFloorPlans(locationId: string, orderedIds: string[]): Promise<ServiceResult> { ... }
  async getFloorPlanWithMeta(id: string): Promise<ServiceResult<{ plan: FloorPlan; markerCount: number; locationPath: string }>> { ... }
  async getAllFloorPlansGrouped(): Promise<ServiceResult<FloorPlanGroup[]>> { ... }
}
```

---

## Navigation Integration

App.tsx uses a flat toggle-button pattern (no router). Add Floor Plans the same way:

```typescript
// In App.tsx, add state:
const [showFloorPlans, setShowFloorPlans] = useState(false);

// Add button alongside existing ones:
<button onClick={() => setShowFloorPlans(!showFloorPlans)}>
  {showFloorPlans ? 'Hide Floor Plans' : 'Manage Floor Plans'}
</button>

// Render component:
{showFloorPlans && <FloorPlanList />}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | dnd-kit | 2022 (rbd deprecated) | dnd-kit is actively maintained, better accessibility, smaller bundle |
| Store images in DB as BLOB | Store files on disk, path in DB | Always the right approach for desktop apps | SQLite BLOBs don't scale well; disk storage is portable |
| PDF rasterization in browser | Native backend (Rust FFI to MuPDF/Poppler) | 2023+ | Browser-based PDF rendering lacks rasterization fidelity |
| Image format conversion server-side | Canvas-based client-side conversion | 2020+ | Modern browsers handle canvas well; no server round-trip needed |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Deprecated 2022 by Atlassian. Do not use.
- `<img>` with `file://` URLs in Tauri WebView: Does not work reliably. Use `URL.createObjectURL` from `readFile` data instead.

---

## Open Questions

### 1. locationId Nullability at Import Time
- **What we know:** CONTEXT says "Location is assigned AFTER import -- image saves first with a placeholder, user edits afterward." The current `FloorPlanSchema` requires `locationId` as a non-optional UUID. The DB column is `NOT NULL`.
- **What's unclear:** Should we (A) make `locationId` nullable in both schema and DB (requires migration + schema update), or (B) require location selection during import (simpler, but contradicts CONTEXT)?
- **Recommendation:** Option A. Add a migration to make `location_id` nullable (`ALTER TABLE floor_plans ALTER COLUMN location_id DROP NOT NULL` -- but SQLite does not support ALTER COLUMN). For SQLite, this requires recreating the table. Drizzle-kit handles this via its migration generator if the schema is updated. Update `FloorPlanSchema` to `locationId: z.string().uuid().nullable()`. This is the correct approach but adds migration complexity. If the planner decides this is too risky, fall back to Option B and require location selection in the import dialog.

### 2. Image URL Resolution Performance
- **What we know:** Each card needs to display a thumbnail. Thumbnails are stored as PNG files on disk. Tauri WebView cannot load `file://` URLs in `<img>` tags reliably.
- **What's unclear:** For 20+ floor plans, reading each file and creating an object URL on mount could be slow.
- **Recommendation:** Use lazy loading: only resolve image URLs for cards currently visible in the viewport (or within one viewport of scroll). React `useIntersectionObserver` or simply batch-load on mount with a limit. For the initial implementation, load all on mount -- optimize only if user reports visible lag.

### 3. Single vs Multi-File Import
- **What we know:** CONTEXT marks this as Claude's discretion. The import workflow described is: pick files, preview, assign location, save.
- **Recommendation:** Single file import only for this phase. Rationale: (A) Each floor plan needs individual location assignment and name review. (B) Multi-file import with per-file location assignment adds significant UI complexity. (C) Users can import multiple plans by repeating the import action. This matches the "pick the simpler approach" guidance.

### 4. Floor Plan Duplication
- **What we know:** CONTEXT says "add if trivial, skip if it adds complexity."
- **Recommendation:** Skip duplication in this phase. Duplicating an image file + DB record is trivial, but adding a "Duplicate" button, handling naming conflicts, and testing the copy is not zero-effort. It adds a code path that must be tested. Defer to Phase 5 or 6 if users request it.

---

## Plan Breakdown Recommendation

Recommended split into 4 sub-plans:

| Plan | Name | What It Covers |
|------|------|----------------|
| 04-01 | Schema + Service + Mock | Add `display_order` column (migration), update FloorPlan entity/schema/repo, create `FloorPlanService`, create `MockFloorPlanRepository`, wire into RepositoryFactory |
| 04-02 | Import Workflow | `FloorPlanImportDialog` component: file picker, image load/convert (canvas + tiff.js), preview, name input, save via FloorPlanService. Single-file import. |
| 04-03 | Card List + Detail View | `FloorPlanList` (grouped card grid with drag-to-reorder), `FloorPlanCard`, `FloorPlanDetailView` (edit name, reassign location). Wire into App.tsx navigation. |
| 04-04 | Delete Safety + Bulk Actions | Single delete with marker warning, bulk delete with per-plan stepped warnings, sequential delete loop. |

**Rationale:** 04-01 is foundation (no UI). 04-02 is the import entry point (can be tested independently). 04-03 is the main list view (depends on 04-01 and 04-02 for data). 04-04 is delete safety which touches the list but is logically separate.

---

## Sources

### Primary (HIGH confidence)
- `src/infrastructure/repositories/interfaces/IFloorPlanRepository.ts` -- interface contract, verified by reading
- `src/infrastructure/repositories/sqlite/SqliteFloorPlanRepository.ts` -- full implementation, verified by reading
- `src/infrastructure/storage/LocalFileStorage.ts` -- image storage service, verified by reading
- `src/infrastructure/database/schema.ts` -- table definitions and relations, verified by reading
- `src/domain/entities/FloorPlan.ts` -- entity class, verified by reading
- `src/domain/validators/schemas.ts` -- Zod schemas, verified by reading
- Tauri Dialog Plugin docs: [https://v2.tauri.app/plugin/dialog/](https://v2.tauri.app/plugin/dialog/) -- verified via WebFetch
- dnd-kit Sortable docs: [https://docs.dndkit.com/presets/sortable](https://docs.dndkit.com/presets/sortable) -- verified via WebFetch
- MDN HTMLCanvasElement.toBlob(): [https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

### Secondary (MEDIUM confidence)
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) -- confirmed dnd-kit as top recommendation
- [dnd-kit npm page](https://www.npmjs.com/package/@dnd-kit/sortable) -- version info
- [How to Resize an Image with JavaScript](https://www.dynamsoft.com/codepool/how-to-resize-image-with-javascript.html) -- canvas resize pattern
- Phase 3 RESEARCH.md (`03-RESEARCH.md`) -- established patterns for bulk actions, service structure, dialog patterns

### Tertiary (LOW confidence)
- TIFF support via `tiff.js`: package exists on npm, but not verified against Context7 or official docs. The package is widely referenced. Validate during implementation that the API matches the code example above.
- PDF rasterization via Rust FFI: mentioned in multiple sources but not tested. Deferred from this phase.

---

## Metadata

**Confidence breakdown:**
- Existing code inventory: HIGH -- all files read and verified directly
- Standard stack (dnd-kit, canvas conversion): HIGH -- official docs verified
- Architecture patterns: HIGH -- follows established patterns from Phase 2 and 3 in this codebase
- Pitfalls: MEDIUM -- based on known browser/Tauri behaviors and codebase patterns; TIFF color channel issue is speculative
- Schema change (display_order): HIGH -- standard SQLite integer column, Drizzle migration pattern established
- PDF feasibility assessment: HIGH -- correctly identified as requiring native backend, deferred

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days -- MUI, dnd-kit, Tauri v2 are stable; tiff.js is stable)
