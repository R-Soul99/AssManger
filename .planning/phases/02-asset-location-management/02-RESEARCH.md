# Phase 2: Asset & Location Management - Research

**Researched:** 2026-02-27
**Domain:** React CRUD operations, hierarchical data management, CSV export
**Confidence:** HIGH

## Summary

Phase 2 delivers core non-spatial asset management features (CRUD, search, filter, hierarchy navigation, CSV export) before adding spatial complexity in later phases. This validates the repository layer established in Phase 1 and provides the data management foundation for the spatial UI.

The established React + MUI v5 + Drizzle ORM stack from Phase 1 provides the foundation. Research focuses on three key areas:

1. **TreeView for Location Hierarchy** - MUI X TreeView renders Building→Floor→Room hierarchy with expand/collapse, icons, and selection handling
2. **Search/Filter Patterns** - Debounced search with React hooks, multi-dimensional filtering (type, location, status)
3. **Excel-Compatible CSV Export** - UTF-8 BOM + field quoting ensures round-trip compatibility through Excel

**Primary recommendation:** Build on existing MUI Table patterns, implement TreeView for location navigation, use React Hook Form + Zod for asset forms, and leverage existing CsvExportService with UTF-8 BOM for Excel compatibility.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**1. Location Hierarchy Management**
- Visualization: Building → Floor → Room hierarchy in file explorer-style tree view (left sidebar)
- Creation: General "Add Location" button + right-click context menu
- Top-down creation recommended (Building before Floor before Room)
- Editing via right-click context menu, moving via "Move to..." option
- Display: location name only initially, UI designed for future enhancements (asset count, location code)

**2. Asset Type Management**
- Terminology: "Asset Types" (not "Categories")
- Types: PC, Phone, Printer, Monitor, Electronics, Custom Machinery
- Icon library for asset type selection with custom icon upload support
- Color picker with curated palette + full picker (hex input)
- Visual consistency: asset type colors apply to tree items and future floor plan markers
- Default types offered via template choice on new projects (blank or pre-defined)

**3. Asset CRUD Operations**
- Required fields: tag, description, asset type, location
- Details pane (right sidebar) shows/edits all asset fields
- Inline editing where practical
- Search by: tag, description, asset type, location
- Filter by: asset type, location, status
- Performance target: handle hundreds of assets smoothly

**4. CSV Export**
- Export targets: Assets table (all fields), Locations table, Asset types table
- Excel compatibility: UTF-8 encoding, headers included, predictable column order
- Must open cleanly in Excel without import dialogs

**5. Error Handling & Data Integrity**
- Location deletion: warning when deleting parent with children, options for cascade delete OR orphan children
- Asset type deletion: warning if assets use this type, reassign to default OR block deletion
- Hierarchy validation: prevent invalid moves (e.g., Building under Room), show error messages
- Allow orphaned locations with warning (can re-parent later)
- Empty location names permitted (though discouraged)

**6. Three-Panel Layout Foundation**
- Left Pane: Location tree with "Add" button
- Middle Pane: Placeholder for future floor plan viewer (blank for Phase 2)
- Right Pane: Details panel for selected object (location or asset)
- Empty project experience: left (empty tree + button), middle (blank canvas + placeholder toolbar), right (empty details or welcome message)

### Claude's Discretion

- MUI TreeView vs custom tree implementation (recommend MUI X TreeView)
- State management approach for filters (recommend custom hooks per existing patterns)
- Form validation UX (recommend react-hook-form + zod per existing patterns)
- Details panel layout and field grouping (optimize for Phase 2 needs, extensible for future)

### Deferred Ideas (OUT OF SCOPE)

- Drag box on floor plan to create location (Phase 5)
- Additional hierarchy levels (e.g., "Section" within Room)
- Floor plan marker interactions (Phase 6)
- Asset count badges on tree locations (Phase 3 or later)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ASSET-01 | User can create assets with required fields (tag, description, asset type, location) | React Hook Form + Zod validation patterns, MUI form components |
| ASSET-02 | User can view asset list with search and filter capabilities | Debounced search hook, filter state management, MUI Table |
| ASSET-03 | User can update asset details (tag, description, type, location, custom fields) | React Hook Form dirty state tracking, side drawer pattern |
| ASSET-04 | User can delete assets with confirmation | MUI Dialog confirmation pattern |
| ASSET-05 | Asset types defined: PC, Phone, Printer, Monitor, Electronics, Custom Machinery | AssetType repository from Phase 1, icon selection patterns |
| ASSET-06 | User can search assets by tag, description, type, or location | Debounced search, multi-column filtering |
| ASSET-07 | User can filter assets by asset type, location, or status | Filter state hooks, MUI Autocomplete/Select patterns |
| ASSET-08 | Asset detail view shows all metadata and linked spatial placement | Details drawer layout, read-only display patterns |
| LOC-01 | User can create location hierarchy (Building → Floor → Room structure) | LocationService from Phase 1, hierarchy validation |
| LOC-02 | User can view location tree in left sidebar | MUI X TreeView, SimpleTreeView component |
| LOC-03 | User can navigate tree to select Building or Floor for floor plan display | TreeView selection handlers, expand/collapse state |
| LOC-04 | User can edit location names and hierarchy relationships | LocationDialog pattern from Phase 1, move validation |
| LOC-05 | User can delete locations (with cascade warning if assets/floor plans linked) | hasChildren/hasAssets repository methods, confirmation dialog |
| LOC-06 | Locations persist building/floor/room relationships in database | Location entity with parentId, LocationRepository |
| EXPORT-01 | User can export assets table to CSV | CsvExportService with UTF-8 BOM |
| EXPORT-02 | User can export locations hierarchy to CSV | CsvExportService.exportLocations method |
| EXPORT-03 | User can export asset types to CSV | CsvExportService.exportCategories method (adapt for asset types) |
| EXPORT-04 | CSV exports use UTF-8 BOM encoding for Excel compatibility | `\uFEFF` prefix in Blob creation |
| EXPORT-05 | CSV exports include headers and predictable column order | Column definition arrays in CsvExportService |
| EXPORT-06 | CSV field quoting to prevent data corruption through Excel | RFC 4180 escapeCsvField function |
| EXPORT-07 | User can select export destination path via file dialog | Tauri save dialog, revealItemInDir for UX |
</phase_requirements>

## Standard Stack

The established libraries/tools for this domain (all already installed from Phase 1):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | 7.3.7 | Table, Drawer, Dialogs, form components | Project-wide UI framework, provides TreeView-compatible components |
| @mui/x-tree-view | 8.26.0 | Hierarchical location tree display | Official MUI component for tree structures with icons, expand/collapse |
| React Hook Form | 7.71.1 | Form state & validation | Already installed, industry standard for React forms |
| Zod | 4.3.6 | Schema validation | Already installed, integrates with RHF via @hookform/resolvers |
| Drizzle ORM | 0.45.1 | Database queries (repositories) | Phase 1 foundation, provides type-safe queries |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hookform/resolvers | 5.2.2 | Connect Zod to React Hook Form | Form validation with domain validators |
| @tauri-apps/plugin-dialog | 2.6.0 | File save dialogs for CSV export | User selects export destination |
| @tauri-apps/plugin-opener | 2.5.3 | Show exported file in Explorer | Post-export UX (reveal in folder) |
| React Icons | 5.5.0 | Location type icons (Building, Floor, Room) | Already used in existing LocationTreeView |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MUI Table (manual) | MUI X DataGrid Pro | DataGrid requires $15/dev/month license for multi-sort, column management. User needs are basic - manual implementation with hooks is sufficient |
| React Hook Form | Formik | RHF has better performance (uncontrolled inputs), smaller bundle, already installed |
| Custom CSV | papa-parse library | Papa Parse adds 45KB for features we don't need (parsing). Manual generation is ~150 lines (already implemented) |
| MUI X TreeView | Custom tree component | MUI X TreeView provides accessibility, keyboard nav, consistent styling - no need to reinvent |

**Installation:**
```bash
# All dependencies already installed in Phase 1
# No new packages needed
```

## Architecture Patterns

### Recommended Component Structure
```
src/presentation/components/
├── location/
│   ├── LocationTreeView.tsx          # MUI X TreeView (already exists)
│   ├── LocationDialog.tsx            # Add/Edit location (already exists)
│   └── LocationManager.tsx           # Tree + dialogs wrapper (already exists)
├── asset/
│   ├── AssetList.tsx                 # Main table view (already exists)
│   ├── AssetListToolbar.tsx          # Search, filters, export (already exists)
│   ├── AssetDetailDrawer.tsx         # Side panel editing (already exists)
│   ├── CreateAssetForm.tsx           # Add asset dialog (already exists)
│   ├── ExportDialog.tsx              # CSV export UI (already exists)
│   └── hooks/
│       ├── useDebounce.ts            # 300ms search delay (already exists)
│       ├── useAssetFilters.ts        # Filter state management (already exists)
│       ├── useAssetSort.ts           # Sort state and comparators (already exists)
│       └── useColumnVisibility.ts    # Show/hide columns (already exists)
└── project/
    ├── CreateProjectDialog.tsx       # Cloud warning integration (exists)
    └── OpenProjectDialog.tsx         # Migration integration (exists)
```

### Pattern 1: MUI X TreeView for Hierarchical Locations
**What:** File explorer-style tree with expand/collapse, icons per type, selection handling
**When to use:** Displaying Building→Floor→Room hierarchy with navigation
**Example:**
```typescript
// Source: Existing LocationTreeView.tsx (verified working)
// Source: https://mui.com/x/react-tree-view/
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Business, Layers, MeetingRoom } from '@mui/icons-material';

interface TreeNode {
  id: string;
  name: string;
  type: LocationType;
  children: TreeNode[];
}

function LocationTreeView({ locations, onSelect, selectedId }) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Convert flat location list to tree structure
  const buildTree = (locations: Location[]): TreeNode[] => {
    const locationMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create all nodes
    locations.forEach(loc => {
      locationMap.set(loc.id, {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        children: []
      });
    });

    // Second pass: build parent-child relationships
    locations.forEach(loc => {
      const node = locationMap.get(loc.id)!;
      if (loc.parentId && locationMap.has(loc.parentId)) {
        locationMap.get(loc.parentId)!.children.push(node);
      } else {
        roots.push(node); // Root nodes
      }
    });

    return roots;
  };

  const renderTree = (node: TreeNode) => (
    <TreeItem
      key={node.id}
      itemId={node.id}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getIcon(node.type)}
          <span>{node.name}</span>
        </Box>
      }
    >
      {node.children.map(child => renderTree(child))}
    </TreeItem>
  );

  return (
    <SimpleTreeView
      selectedItems={selectedId || null}
      onSelectedItemsChange={(event, itemId) => onSelect?.(itemId)}
      expandedItems={expandedItems}
      onExpandedItemsChange={(event, itemIds) => setExpandedItems(itemIds)}
    >
      {buildTree(locations).map(renderTree)}
    </SimpleTreeView>
  );
}
```

**Key APIs:**
- `SimpleTreeView`: Container component with selection/expansion state
- `TreeItem`: Individual tree node with label, icon, children
- `selectedItems` prop: Controlled selection (string or string[])
- `expandedItems` prop: Controlled expand/collapse state
- `onSelectedItemsChange`: Selection callback
- `onExpandedItemsChange`: Expand/collapse callback

### Pattern 2: Debounced Search with Custom Hook
**What:** Delay search execution until user stops typing (300ms default)
**When to use:** Live search that triggers expensive filtering operations
**Example:**
```typescript
// Source: Existing useDebounce.ts hook (verified working)
// Source: https://www.developerway.com/posts/debouncing-in-react
// Source: https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear timeout on unmount or value change
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in AssetList
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);

useEffect(() => {
  // This only runs 300ms after user stops typing
  loadAssets({ searchTerm: debouncedSearch });
}, [debouncedSearch]);
```

**Benefits:**
- Reduces repository calls from ~10/second to ~3/second during typing
- Prevents UI lag from rapid re-renders
- Cleanup function prevents memory leaks
- 300ms delay is industry standard (250-350ms on mobile per research)

**Optimizations to consider:**
- Combine with AbortController to cancel in-flight requests
- Use `useCallback` for filter function to prevent re-renders
- Cache results for repeated queries (LRU cache)

### Pattern 3: CSV Export with UTF-8 BOM for Excel
**What:** Generate CSV with proper escaping and UTF-8 BOM so Excel opens correctly
**When to use:** Any CSV export that needs Excel compatibility with Unicode
**Example:**
```typescript
// Source: Existing CsvExportService (verified working)
// Source: https://hyunbinseo.medium.com/save-csv-file-in-utf-8-with-bom-29abf608e86e
// Source: https://www.shieldui.com/javascript-unicode-csv-export

// RFC 4180 field escaping
function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) return '';
  const str = String(value);

  // Escape if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

class CsvExportService {
  // UTF-8 BOM - critical for Excel to recognize UTF-8 encoding
  private static readonly UTF8_BOM = '\uFEFF';

  async exportAssets(assets: AssetWithRelations[], filename: string) {
    // Build CSV content
    const headers = ['Asset Tag', 'Description', 'Category', 'Location'];
    const rows = assets.map(({ asset, category, locationPath }) => [
      escapeCsvField(asset.tag),
      escapeCsvField(asset.description),
      escapeCsvField(category?.name),
      escapeCsvField(locationPath)
    ]);

    const csvContent =
      CsvExportService.UTF8_BOM +
      headers.map(escapeCsvField).join(',') + '\n' +
      rows.map(row => row.join(',')).join('\n');

    // Tauri save dialog
    const filePath = await save({
      defaultPath: filename,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (!filePath) return { success: false, error: 'Cancelled' };

    // Write file with UTF-8 encoding
    const encoder = new TextEncoder();
    await writeFile(filePath, encoder.encode(csvContent));

    // Reveal exported file in Explorer
    await revealItemInDir(filePath);

    return { success: true, path: filePath };
  }
}
```

**Critical details:**
- UTF-8 BOM (`\uFEFF`) MUST be first character - Excel uses this to detect UTF-8
- RFC 4180 escaping: quote fields containing `,`, `"`, or newlines
- Internal quotes doubled: `He said "hello"` → `"He said ""hello"""`
- `TextEncoder` ensures proper UTF-8 byte encoding
- `revealItemInDir` shows file in Explorer for immediate user feedback

### Pattern 4: React Hook Form + Zod Validation
**What:** Type-safe form validation with Zod schemas, uncontrolled inputs for performance
**When to use:** Asset create/edit forms with validation
**Example:**
```typescript
// Source: Existing domain validators (Phase 1)
// Source: https://react-hook-form.com/get-started
// Source: https://medium.com/@charuwaka/supercharge-your-react-forms-with-react-hook-form-zod-and-mui-a-powerful-trio-47b653e7dce0

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssetSchema, AssetData } from '@/domain/validators';
import { TextField, Select, MenuItem } from '@mui/material';

function CreateAssetForm({ onSubmit, locations, assetTypes }) {
  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<AssetData>({
    resolver: zodResolver(AssetSchema),
    defaultValues: {
      tag: '',
      description: '',
      status: 'active',
      assetTypeId: null,
      locationId: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="tag"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Asset Tag"
            error={!!errors.tag}
            helperText={errors.tag?.message}
            required
          />
        )}
      />

      <Controller
        name="assetTypeId"
        control={control}
        render={({ field }) => (
          <Select {...field} label="Asset Type" required>
            {assetTypes.map(type => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        )}
      />

      {/* Additional fields... */}

      <Button type="submit" disabled={!isDirty}>
        Save
      </Button>
    </form>
  );
}
```

**Benefits:**
- `zodResolver` provides automatic TypeScript type inference from schema
- `Controller` integrates MUI controlled components with RHF
- `formState.isDirty` enables "unsaved changes" warnings
- `formState.errors` provides field-level validation messages
- Uncontrolled inputs minimize re-renders (performance)

### Pattern 5: Cascade Delete Warning Dialog
**What:** Warn user before deleting parent with children, offer cascade or cancel
**When to use:** Location deletion when hasChildren() or hasAssets() returns true
**Example:**
```typescript
// Source: https://mui.com/material-ui/react-dialog/
// Source: https://github.com/jonatanklosko/material-ui-confirm

import { Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';

function LocationDeleteDialog({ location, onConfirm, onCancel }) {
  const [deleteChildren, setDeleteChildren] = useState(false);
  const hasChildren = location.childCount > 0;
  const hasAssets = location.assetCount > 0;

  return (
    <Dialog open onClose={onCancel}>
      <DialogTitle>Delete Location?</DialogTitle>
      <DialogContent>
        {hasChildren && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This location has {location.childCount} child location(s).
          </Alert>
        )}
        {hasAssets && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This location has {location.assetCount} asset(s) assigned to it.
          </Alert>
        )}

        {hasChildren && (
          <FormControlLabel
            control={
              <Checkbox
                checked={deleteChildren}
                onChange={(e) => setDeleteChildren(e.target.checked)}
              />
            }
            label="Also delete all child locations (cascade delete)"
          />
        )}

        {hasAssets && !deleteChildren && (
          <Typography variant="body2" color="text.secondary">
            Assets will become orphaned (no location assigned).
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onConfirm({ cascade: deleteChildren })}
          color="error"
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Anti-Patterns to Avoid

**1. Storing Entire Canvas as State for Search**
- ❌ Bad: `const [filteredAssets, setFilteredAssets] = useState(allAssets)`
- ✅ Good: Compute filtered view in render from filter state
- Why: Duplicate state causes sync bugs, memory waste

**2. Inline Filter Functions in render()**
- ❌ Bad: `assets.filter(a => a.tag.includes(search))` directly in JSX
- ✅ Good: `useMemo(() => filterAssets(assets, filters), [assets, filters])`
- Why: Re-creates function on every render, performance degradation

**3. Not Cleaning Up setTimeout in useDebounce**
- ❌ Bad: `setTimeout(() => setDebounced(value), delay)` without cleanup
- ✅ Good: Return cleanup function from useEffect
- Why: Memory leaks, stale callbacks firing after unmount

**4. Forgetting UTF-8 BOM in CSV Export**
- ❌ Bad: `new Blob([csvContent], { type: 'text/csv;charset=utf-8' })`
- ✅ Good: `new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })`
- Why: Excel assumes ANSI encoding without BOM, corrupts Unicode

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV field escaping | Custom regex-based escaper | RFC 4180 spec with quote doubling | Edge cases: newlines in fields, quotes at start/end, nested quotes |
| Tree data structure conversion | Manual array loops | Two-pass algorithm (create map, build hierarchy) | O(n²) nested loops vs O(n) map lookup performance |
| Form dirty state tracking | Manual field comparison | React Hook Form `formState.isDirty` | Handles nested objects, arrays, complex types automatically |
| Debounced search | Custom timing logic | useDebounce hook with cleanup | Cleanup prevents memory leaks, race conditions |
| Location hierarchy validation | Ad-hoc parent/child checks | Repository hasChildren/hasAssets methods | Database-level consistency, handles concurrent updates |

**Key insight:** CSV escaping seems simple but has 12+ edge cases (Excel formula injection, Unicode BOM, delimiter detection). Debounced search has 6+ race conditions (cleanup, unmount, rapid changes). Use proven patterns from research.

## Common Pitfalls

### Pitfall 1: Cascade Delete Without Warning
**What goes wrong:** User deletes "Building A" expecting only the building to be removed, but cascades delete 50 child locations and 200 assets with no warning or undo.

**Why it happens:**
- Database foreign keys set to `ON DELETE CASCADE` for convenience
- UI doesn't check `hasChildren()` or `hasAssets()` before delete
- No confirmation dialog explaining consequences
- No option to orphan children instead of cascade

**How to avoid:**
1. Check repository methods BEFORE delete:
   ```typescript
   const hasChildren = await locationRepo.hasChildren(locationId);
   const hasAssets = await locationRepo.hasAssets(locationId);
   if (hasChildren || hasAssets) {
     showCascadeWarningDialog({ hasChildren, hasAssets });
   }
   ```

2. Offer user choice:
   - Cancel (safe default)
   - Delete location only, orphan children (mark parentId = null)
   - Cascade delete all children and assets (destructive, require explicit opt-in)

3. Show impact clearly:
   ```
   Warning: This will delete:
   - 3 child locations (Floor 1, Floor 2, Floor 3)
   - 47 assets assigned to these locations
   This action cannot be undone.
   ```

**Warning signs:**
- Users report "all my data disappeared"
- Support tickets: "can I restore deleted locations?"
- Database has `ON DELETE CASCADE` without UI warnings

**Phase to address:** Phase 2 (Location Management) - implement hasChildren/hasAssets checks and warning dialogs before delete.

---

### Pitfall 2: Search Performance Degradation with Large Datasets
**What goes wrong:** Search feels "laggy" or "frozen" - typing in search box doesn't update immediately, UI stutters, or search results appear 2-3 seconds after typing stops.

**Why it happens:**
- No debouncing - search runs on every keystroke (10+ times per second)
- Filter function runs on every render, not memoized
- Loading all assets into memory (1000+ items) instead of pagination
- Complex filter logic (regex, multi-field search) without indexing

**How to avoid:**
1. Debounce search input (300ms):
   ```typescript
   const debouncedSearch = useDebounce(searchInput, 300);
   useEffect(() => {
     loadAssets({ searchTerm: debouncedSearch });
   }, [debouncedSearch]);
   ```

2. Memoize filter function:
   ```typescript
   const filteredAssets = useMemo(() =>
     assets.filter(matchesFilters),
     [assets, filters]
   );
   ```

3. Use database-level filtering when possible:
   ```typescript
   // ✅ Good: Filter in SQL
   await assetRepo.findAll({ searchTerm, locationId, status });

   // ❌ Bad: Load all, filter in JS
   const all = await assetRepo.findAll();
   const filtered = all.filter(a => matches(a, filters));
   ```

4. Add database indexes:
   ```sql
   CREATE INDEX idx_assets_tag ON assets(tag);
   CREATE INDEX idx_assets_description ON assets(description);
   ```

**Warning signs:**
- Search feels "slow" compared to other apps
- CPU spikes to 100% while typing in search box
- Browser DevTools shows long tasks (>50ms) during search
- Performance degrades from "instant" at 100 assets to "laggy" at 500+

**Phase to address:** Phase 2 (Search Implementation) - debounce from start, add indexes in migration. Phase 3+ (Optimization) - pagination if dataset grows >1000 assets.

---

### Pitfall 3: CSV Round-Trip Data Corruption Through Excel
**What goes wrong:** Export assets to CSV → open in Excel → save → re-import shows corrupted data. Asset tags "001", "002" become "1", "2" (lost leading zeros). International characters "Café" become "CafÃ©" (encoding corruption). Phone numbers "+1 234-567-8900" become "1.23457E+10" (scientific notation).

**Why it happens:**
- Excel auto-formats data based on heuristics (numbers, dates, phone numbers)
- Excel assumes ANSI encoding without UTF-8 BOM marker
- No explicit field quoting - Excel interprets commas as delimiters even inside fields
- Users double-click CSV (auto-open) instead of using Import Data wizard

**How to avoid:**
1. ALWAYS include UTF-8 BOM:
   ```typescript
   const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows;
   ```

2. Quote ALL fields (even numeric) to prevent auto-formatting:
   ```typescript
   function escapeCsvField(value: any): string {
     if (value == null) return '';
     const str = String(value);
     // Always quote if contains comma, quote, or newline
     if (str.includes(',') || str.includes('"') || str.includes('\n')) {
       return `"${str.replace(/"/g, '""')}"`;
     }
     return str;
   }
   ```

3. Provide user guidance in UI:
   ```
   ℹ️ To edit in Excel:
   1. Right-click CSV → "Get Data" or "Import Data"
   2. Select "Delimited" and "UTF-8" encoding
   3. Do NOT double-click to open (causes formatting issues)
   ```

4. Validate on import - detect corruption:
   ```typescript
   // Check if asset tags lost leading zeros
   if (imported.tag !== original.tag) {
     showWarning(`Tag changed from "${original.tag}" to "${imported.tag}"`);
   }
   ```

**Warning signs:**
- Users report "asset tags changed after export/import"
- International characters display as gibberish: "Ã©", "Ã±", "Ã¼"
- Numeric IDs lose formatting: "00123" → "123"
- Dates change format: "2025-10-15" → "Oct-15-25"

**Phase to address:** Phase 2 (CSV Export) - implement UTF-8 BOM and RFC 4180 field quoting from start. Cannot be retrofitted easily once users have corrupted exports.

---

### Pitfall 4: Location Tree Rendering Performance with Deep Hierarchies
**What goes wrong:** Tree becomes sluggish or unresponsive with 100+ locations or 5+ levels deep. Expand/collapse animations stutter. Selecting location causes 1-2 second delay before details panel updates.

**Why it happens:**
- Recursive renderTree() function creates O(n²) complexity with deep nesting
- No virtualization - all 100+ TreeItems render even if only 10 visible
- Full tree re-renders on every state change (selection, expansion)
- Building tree structure on every render instead of memoizing

**How to avoid:**
1. Memoize tree building:
   ```typescript
   const treeData = useMemo(() => buildTree(locations), [locations]);
   ```

2. Use React.memo for TreeItem components:
   ```typescript
   const TreeItemMemo = React.memo(({ node }) => (
     <TreeItem itemId={node.id} label={node.name}>
       {node.children.map(child => <TreeItemMemo key={child.id} node={child} />)}
     </TreeItem>
   ));
   ```

3. Limit initial expansion depth:
   ```typescript
   // Only expand first level on mount
   const [expandedItems, setExpandedItems] = useState(() =>
     locations.filter(loc => loc.type === 'building').map(loc => loc.id)
   );
   ```

4. For extreme scale (500+ locations), use react-window virtualization

**Warning signs:**
- Tree takes 1-2 seconds to initially render
- Expand/collapse animations drop frames
- Selecting location causes visible lag before details update
- DevTools Performance shows long tasks (>50ms) in tree rendering

**Phase to address:** Phase 2 (Tree Implementation) - memoization from start. Phase 4+ (Optimization) - virtualization only if users have 500+ locations (unlikely for v1).

---

### Pitfall 5: Orphaned Assets After Location Delete
**What goes wrong:** User deletes "Floor 2" location, 30 assets previously assigned to Floor 2 rooms become orphaned (locationId points to deleted location). Assets disappear from location filter dropdown, can't be found by location search, show "Unknown location" in UI.

**Why it happens:**
- Foreign key set to `ON DELETE SET NULL` (orphans assets) without UI warning
- No pre-delete check for assigned assets
- No option to reassign assets before delete
- Repository allows location delete without cascade validation

**How to avoid:**
1. Check for assigned assets before delete:
   ```typescript
   const assetCount = await locationRepo.hasAssets(locationId);
   if (assetCount > 0) {
     showWarning(`This location has ${assetCount} assets. Delete anyway?`);
   }
   ```

2. Offer reassignment option:
   ```
   This location has 47 assets assigned to it.

   ○ Move assets to: [Select location ▼]
   ○ Leave assets orphaned (no location)
   ○ Cancel delete
   ```

3. Database constraint prevents orphaning:
   ```sql
   -- Existing constraint (Phase 1)
   FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT
   ```

4. Show orphaned assets prominently in UI:
   ```
   Filter by location:
   ⚠️ No Location (23 assets) <-- Orphaned assets
   Building A
   └─ Floor 1
   ```

**Warning signs:**
- Users report "assets disappeared after deleting location"
- Asset count doesn't match sum of location counts
- Support tickets: "how do I find orphaned assets?"
- Database query shows `location_id IS NULL`

**Phase to address:** Phase 2 (Location Management) - implement `ON DELETE RESTRICT` foreign key (already done in Phase 1 schema), add hasAssets() check and warning dialog.

---

### Pitfall 6: No Undo for Bulk Asset Delete
**What goes wrong:** User selects 50 assets, clicks "Delete Selected", confirmation dialog shows "Delete 50 assets?", user clicks "Delete", then immediately realizes wrong assets were selected. No undo option - data permanently lost.

**Why it happens:**
- No undo/redo system implemented
- Confirmation dialog doesn't show what's being deleted (just count)
- Bulk delete executes immediately on confirmation
- No soft delete (status flag) - hard delete from database

**How to avoid:**
1. Show preview of what's being deleted:
   ```
   Delete 3 assets?

   - PC-001 (Building A, Floor 1, Room 101)
   - PC-002 (Building A, Floor 1, Room 102)
   - PHONE-045 (Building B, Floor 2, Reception)

   This action cannot be undone.
   ```

2. Implement soft delete for Phase 2:
   ```typescript
   // Instead of deleting, set status = 'deleted'
   await assetRepo.update(id, { status: 'deleted', deletedAt: new Date() });
   // Hide from UI by default, show in "Recently Deleted" view
   ```

3. Defer undo/redo to Phase 3+:
   - Command pattern for all mutations
   - Undo stack with 50-item limit
   - Ctrl+Z keyboard shortcut

4. For critical operations, require typed confirmation:
   ```
   Type "DELETE" to confirm deletion of 50 assets:
   [_________]  <-- User must type exactly "DELETE"
   ```

**Warning signs:**
- Users report "accidentally deleted assets, can't undo"
- Support tickets requesting data recovery from backups
- Users hesitant to use bulk delete feature (too risky)

**Phase to address:** Phase 2 (Bulk Delete) - show preview, require explicit confirmation. Phase 3+ (Undo/Redo) - implement command pattern if user feedback indicates need.

## Code Examples

Verified patterns from existing codebase and official sources:

### Example 1: Location Tree with Expand/Collapse State
```typescript
// Source: src/presentation/components/location/LocationTreeView.tsx
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

function LocationTreeView({ locations, onSelect, selectedId }) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const buildTree = (locations: Location[]): TreeNode[] => {
    const locationMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Create all nodes
    locations.forEach(loc => {
      locationMap.set(loc.id, {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        children: []
      });
    });

    // Build hierarchy
    locations.forEach(loc => {
      const node = locationMap.get(loc.id)!;
      if (loc.parentId && locationMap.has(loc.parentId)) {
        locationMap.get(loc.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  return (
    <SimpleTreeView
      selectedItems={selectedId || null}
      onSelectedItemsChange={(event, itemId) => onSelect?.(itemId)}
      expandedItems={expandedItems}
      onExpandedItemsChange={(event, itemIds) => setExpandedItems(itemIds)}
    >
      {buildTree(locations).map(renderTreeItem)}
    </SimpleTreeView>
  );
}
```

### Example 2: CSV Export with UTF-8 BOM and Field Escaping
```typescript
// Source: src/application/services/CsvExportService.ts
class CsvExportService {
  private static readonly UTF8_BOM = '\uFEFF';

  async exportAssets(assets: AssetWithRelations[], filename: string) {
    const headers = ['Asset Tag', 'Description', 'Category', 'Location'];
    const rows = assets.map(({ asset, category, locationPath }) => [
      escapeCsvField(asset.tag),
      escapeCsvField(asset.description),
      escapeCsvField(category?.name),
      escapeCsvField(locationPath)
    ]);

    const csvContent =
      CsvExportService.UTF8_BOM +
      headers.map(escapeCsvField).join(',') + '\n' +
      rows.map(row => row.join(',')).join('\n');

    const filePath = await save({ defaultPath: filename });
    if (!filePath) return { success: false, error: 'Cancelled' };

    await writeFile(filePath, new TextEncoder().encode(csvContent));
    await revealItemInDir(filePath); // Show in Explorer

    return { success: true, path: filePath };
  }
}

function escapeCsvField(value: any): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
```

### Example 3: Debounced Search with Cleanup
```typescript
// Source: src/presentation/components/asset/hooks/useDebounce.ts
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup prevents memory leaks
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);

useEffect(() => {
  loadAssets({ searchTerm: debouncedSearch });
}, [debouncedSearch]);
```

### Example 4: React Hook Form + Zod Integration
```typescript
// Source: https://react-hook-form.com/get-started
// Source: Existing domain validators (AssetSchema)
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function CreateAssetForm({ onSubmit }) {
  const { control, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(AssetSchema),
    defaultValues: { tag: '', description: '', status: 'active' }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="tag"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Asset Tag"
            error={!!errors.tag}
            helperText={errors.tag?.message}
            required
          />
        )}
      />
      <Button type="submit" disabled={!isDirty}>Save</Button>
    </form>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MUI Lab TreeView | MUI X TreeView (@mui/x-tree-view) | 2023 | Migration required, better performance, new API |
| Custom debounce with setInterval | useDebounce hook with setTimeout + cleanup | 2024 | Prevents memory leaks, consistent API |
| CSV export without BOM | UTF-8 BOM prefix (\uFEFF) | 2022-2023 | Excel compatibility for Unicode, industry standard |
| Formik for React forms | React Hook Form with Zod | 2023-2024 | Better performance, type safety, smaller bundle |
| Manual CSV field quoting | RFC 4180 spec (quote if contains ,/" /newline) | Always standard | Data corruption prevention |

**Deprecated/outdated:**
- TreeView from @mui/lab - moved to @mui/x-tree-view (migration path: replace imports)
- Papa Parse for export (still valid for import, but overkill for simple export)
- Lodash debounce (still works, but custom hook is lightweight alternative)

## Open Questions

1. **Asset Type Color Picker Implementation**
   - What we know: User wants curated palette + full hex picker
   - What's unclear: Should we use react-colorful (already installed) or MUI's color picker?
   - Recommendation: Use react-colorful with preset swatches - already installed, lightweight (2KB), good UX

2. **Location Move Validation**
   - What we know: Prevent invalid moves (Building under Room)
   - What's unclear: Should validation be client-side only or also server-side in LocationService?
   - Recommendation: Both - client-side for UX, server-side for data integrity

3. **Details Panel State Management**
   - What we know: Right sidebar shows selected location or asset details
   - What's unclear: How to handle switching between location view and asset view?
   - Recommendation: Union type `DetailsPanelState = { type: 'location', data: Location } | { type: 'asset', data: Asset } | { type: 'empty' }`

## Sources

### Primary (HIGH confidence)
- [MUI X TreeView Documentation](https://mui.com/x/react-tree-view/) - Official MUI X component API
- [MUI X DataGrid Filtering](https://mui.com/x/react-data-grid/filtering/) - Filter patterns and quick filter
- [React Hook Form Get Started](https://react-hook-form.com/get-started) - Official RHF documentation
- [UTF-8 BOM for CSV in JavaScript](https://hyunbinseo.medium.com/save-csv-file-in-utf-8-with-bom-29abf608e86e) - Excel compatibility
- [CSV Export with Unicode](https://www.shieldui.com/javascript-unicode-csv-export) - BOM implementation

### Secondary (MEDIUM confidence)
- [React Debounce Patterns](https://www.developerway.com/posts/debouncing-in-react) - Comprehensive debounce guide
- [React Debounce Search Optimization](https://medium.com/nerd-for-tech/debounce-your-search-react-input-optimization-fd270a8042b) - Performance patterns
- [Material-UI Confirmation Dialog](https://dev.to/uguremirmustafa/material-ui-reusable-confirmation-dialog-in-react-2jnl) - Reusable dialog pattern
- [React Hook Form + Zod + MUI Integration](https://medium.com/@charuwaka/supercharge-your-react-forms-with-react-hook-form-zod-and-mui-a-powerful-trio-47b653e7dce0) - Integration guide

### Tertiary (LOW confidence)
- None - all research verified with official documentation or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and verified working from Phase 1
- Architecture: HIGH - Patterns verified in existing codebase (LocationTreeView, CsvExportService, useDebounce)
- Pitfalls: HIGH - Sourced from existing PITFALLS.md research (Pitfall #4 CSV corruption, Pitfall #2 performance)

**Research date:** 2026-02-27
**Valid until:** ~60 days (stable technologies, React ecosystem changes slowly)

**Note:** Phase 1 already completed foundation work (repositories, domain entities, database schema). Phase 2 builds UI layer on top of existing services. No breaking changes to foundation expected.
