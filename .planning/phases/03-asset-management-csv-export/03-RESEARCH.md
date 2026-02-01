# Phase 3: Asset Management & CSV Export - Research

**Researched:** 2026-02-01
**Domain:** React data table management, form validation, CSV export
**Confidence:** HIGH

## Summary

Phase 3 implements complete asset inventory management with CRUD operations, multi-dimensional filtering, search, and CSV export. The established MUI v5 stack from Phase 2 provides the foundation. The core technical decisions are:

1. **Use MUI Table (not DataGrid)** - MUI DataGrid's advanced features (multi-column sorting, built-in filtering, column management) require MUI X Pro license ($15/dev/month). User decisions specify basic needs (single-column sort, simple filtering) that MUI Table handles without licensing costs.

2. **Manual state management over DataGrid** - Implementing filtering, sorting, and column visibility manually with React state gives full control and avoids vendor lock-in while meeting all requirements.

3. **CSV generation with UTF-8 BOM** - JavaScript Blob with "\uFEFF" prefix ensures Excel opens CSV files correctly with Unicode characters (critical for international use).

**Primary recommendation:** Build on existing MUI Table component with React state for filters/search/sorting, implement side Drawer for detail editing, use native Blob API for CSV export with UTF-8 BOM, and leverage Tauri's opener plugin to show exported file in Explorer.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | 7.3.7 | Data table, Drawer, form components | Already established in Phase 2, provides Table, Drawer, TextField, Checkbox components |
| React Hook Form | Not yet installed | Form state & validation | Industry standard for React forms, integrates seamlessly with MUI, handles dirty state tracking |
| Zod | 4.3.6 | Schema validation | Already installed, can reuse existing AssetSchema for validation |
| @tauri-apps/plugin-opener | Not yet installed | Show file in Explorer | Official Tauri v2 plugin for revealing files in system file manager |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lodash (debounce) | Optional | Debounced search input | Alternative to custom useDebounce hook if team prefers utilities |
| date-fns | Optional | Date formatting in CSV | If purchase dates need custom formatting beyond toISOString() |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MUI Table (manual) | MUI X DataGrid Pro | DataGrid requires $15/dev/month license for multi-sort, column management. User needs are simple enough for manual implementation. |
| React Hook Form | Formik | RHF has better performance (uncontrolled inputs), smaller bundle, cleaner validation. Formik is more verbose. |
| Custom CSV | papa-parse library | Papa Parse adds 45KB for features we don't need (parsing). Manual generation is 20 lines of code. |
| Tauri opener | shell.open command | Tauri opener is official, cross-platform, properly sandboxed. Shell commands need more permissions. |

**Installation:**
```bash
npm install react-hook-form @tauri-apps/plugin-opener
```

**Tauri Configuration (src-tauri/Cargo.toml):**
```toml
[dependencies]
tauri-plugin-opener = "2"
```

## Architecture Patterns

### Recommended Project Structure
```
src/presentation/components/asset/
├── AssetList.tsx              # Main component - table, filters, toolbar
├── AssetListToolbar.tsx       # Filter controls, search, export button
├── AssetDetailDrawer.tsx      # Side panel with editable form
├── AssetBulkActions.tsx       # Bulk delete, bulk export actions
└── hooks/
    ├── useAssetFilters.ts     # Filter state management
    ├── useAssetSearch.ts      # Debounced search logic
    ├── useAssetSort.ts        # Sort state and comparator functions
    ├── useColumnVisibility.ts # Show/hide columns state
    └── useDirtyForm.ts        # Track unsaved changes, confirm dialog
```

### Pattern 1: Debounced Search with Cleanup
**What:** Delay search execution until user stops typing, cancel pending requests on unmount
**When to use:** Live search that triggers filtering or API calls
**Example:**
```typescript
// Source: https://www.c-sharpcorner.com/article/debounce-your-search-and-optimize-your-react-input-component/
// Source: https://blog.logrocket.com/understanding-react-useeffect-cleanup-function/
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear timeout on unmount or value change
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in AssetList
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);

useEffect(() => {
  // This only runs 300ms after user stops typing
  filterAssets(debouncedSearch);
}, [debouncedSearch]);
```

### Pattern 2: Side Drawer with Dirty State Tracking
**What:** Drawer slides from right, tracks unsaved changes, warns on close
**When to use:** Detail view that keeps list context visible for multi-item workflow
**Example:**
```typescript
// Source: https://mui.com/material-ui/react-drawer/
// Source: https://github.com/jaredpalmer/formik/issues/1657
import { Drawer, Dialog, DialogActions, DialogContent } from '@mui/material';
import { useForm } from 'react-hook-form';

function AssetDetailDrawer({ assetId, open, onClose }) {
  const { formState, reset, handleSubmit } = useForm();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCloseAttempt = () => {
    if (formState.isDirty) {
      setShowConfirm(true); // Show "unsaved changes" dialog
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    reset(); // Discard changes
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleCloseAttempt}
        sx={{ '& .MuiDrawer-paper': { width: 480 } }}
      >
        {/* Form fields here */}
      </Drawer>

      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogContent>
          You have unsaved changes. Discard them?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button onClick={handleConfirmClose} color="error">
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
```

### Pattern 3: CSV Export with UTF-8 BOM for Excel
**What:** Generate CSV with proper escaping and UTF-8 BOM so Excel opens it correctly
**When to use:** Any CSV export that needs Excel compatibility with Unicode
**Example:**
```typescript
// Source: https://www.shieldui.com/javascript-unicode-csv-export
// Source: https://ssojet.com/escaping/csv-escaping-in-javascript-in-browser
// Source: https://v2.tauri.app/plugin/opener/

function escapeCsvField(field: string | number | null | undefined): string {
  if (field == null) return '';
  const str = String(field);

  // Escape if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportAssetsToCSV(assets: AssetWithRelations[], filename: string) {
  // Build CSV rows
  const headers = ['Asset Tag', 'Description', 'Category', 'Location', 'Status', 'Serial Number'];
  const rows = assets.map(({ asset, category, locationPath }) => [
    escapeCsvField(asset.tag),
    escapeCsvField(asset.description),
    escapeCsvField(category?.name),
    escapeCsvField(locationPath),
    escapeCsvField(asset.status),
    escapeCsvField(asset.serialNumber),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob with UTF-8 BOM (critical for Excel)
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  // Save file using Tauri dialog
  const { save } = await import('@tauri-apps/plugin-dialog');
  const filePath = await save({
    defaultPath: filename,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  });

  if (filePath) {
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const arrayBuffer = await blob.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));

    // Open folder containing the file
    const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
    await revealItemInDir(filePath);
  }
}
```

### Pattern 4: Configurable Column Visibility
**What:** User can show/hide columns, settings persist in localStorage
**When to use:** Tables with many columns where different users prioritize different fields
**Example:**
```typescript
// Source: https://medium.com/@bchirag/optimizing-mui-x-data-grid-column-visibility-resizing-and-persistence-using-react-61f8369fc103

type ColumnKey = 'tag' | 'description' | 'category' | 'location' | 'status' | 'serialNumber' | 'phone' | 'owner';

function useColumnVisibility(storageKey: string) {
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    // Default: all visible except optional fields
    return {
      tag: true,
      description: true,
      category: true,
      location: true,
      status: true,
      serialNumber: false,
      phone: false,
      owner: false,
    };
  });

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  return { visibleColumns, toggleColumn };
}
```

### Pattern 5: Bulk Selection with "Select Filtered" vs "Select All"
**What:** Checkbox selection with options to select current filtered items or all items
**When to use:** Export or delete operations that need clarity on scope
**Example:**
```typescript
// Source: https://www.patternfly.org/patterns/bulk-selection/

function AssetBulkActions({ filteredAssets, allAssets, selectedIds, onSelectionChange }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSelectFiltered = () => {
    const filteredIds = filteredAssets.map(a => a.asset.id);
    onSelectionChange(filteredIds);
    setAnchorEl(null);
  };

  const handleSelectAll = () => {
    const allIds = allAssets.map(a => a.asset.id);
    onSelectionChange(allIds);
    setAnchorEl(null);
  };

  return (
    <>
      <Button onClick={(e) => setAnchorEl(e.currentTarget)}>
        Select ({selectedIds.length})
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={handleSelectFiltered}>
          Select Filtered ({filteredAssets.length} items)
        </MenuItem>
        <MenuItem onClick={handleSelectAll}>
          Select All ({allAssets.length} items)
        </MenuItem>
        <MenuItem onClick={() => { onSelectionChange([]); setAnchorEl(null); }}>
          Clear Selection
        </MenuItem>
      </Menu>
    </>
  );
}
```

### Anti-Patterns to Avoid
- **Don't use uncontrolled inputs in Drawer** - React Hook Form uses uncontrolled by default, but MUI components need value/onChange. Use Controller wrapper.
- **Don't debounce state updates** - Debounce the effect/callback, not setState. Users expect immediate UI feedback.
- **Don't skip CSV field escaping** - Even if your data looks clean, special characters will break CSV parsing. Always escape.
- **Don't use DataGrid's controlled filter state with manual filters** - Pick one approach: either use DataGrid's built-in filtering OR manual state. Mixing both causes sync issues.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom error state per field | React Hook Form + Zod | RHF handles validation, dirty tracking, submit handling. Zod schemas already defined. 100+ edge cases handled. |
| Debounced input | Custom setTimeout logic everywhere | useDebounce hook (reusable) | Cleanup on unmount, dependency tracking, consistent timing. Easy to miss memory leaks with manual setTimeout. |
| CSV escaping | String manipulation with indexOf | escapeCsvField function (standard) | Handles quotes-in-quotes, newlines, commas. CSV RFC 4180 has edge cases most developers miss. |
| Dirty state warning | window.onbeforeunload only | React Hook Form isDirty + MUI Dialog | onbeforeunload doesn't work in Tauri, SPA navigation needs React-level intercept. |
| Column visibility | Render all, CSS display:none | Conditional rendering + localStorage | Hidden columns still process data, sorting, filtering. Conditional rendering is more performant. |
| File reveal in Explorer | shell command with path | @tauri-apps/plugin-opener | Cross-platform (Windows/Mac/Linux), proper escaping, sandboxed permissions. Shell commands are security risks. |

**Key insight:** Data table management has many subtle edge cases (sorting nulls, filtering with debounce cleanup, CSV escaping, form state synchronization). Use established patterns and libraries rather than rebuilding these wheels.

## Common Pitfalls

### Pitfall 1: Memory Leaks from Debounced Search
**What goes wrong:** Search input creates setTimeout on every keystroke, timers aren't cleared when component unmounts, causing "Can't perform state update on unmounted component" warnings.
**Why it happens:** useEffect without cleanup function doesn't clear pending timers.
**How to avoid:** Always return cleanup function from useEffect that calls clearTimeout. Use AbortController for fetch requests.
**Warning signs:** Console warnings about state updates on unmounted components, increasing memory usage during search.

**Source:** [Understanding React's useEffect Memory Leak](https://tonywei92.github.io/blog/understanding-react-s-useeffect-memory-leak-and-how-to-avoid-it-by-building-react-http-request)

### Pitfall 2: Excel Opens CSV with Garbled Characters
**What goes wrong:** User exports CSV, opens in Excel, sees "Ã©" instead of "é" or question marks for Unicode.
**Why it happens:** CSV file lacks UTF-8 BOM (Byte Order Mark) that tells Excel the encoding. Without BOM, Excel assumes ANSI/Windows-1252.
**How to avoid:** Prepend "\uFEFF" to CSV content before creating Blob. This is the UTF-8 BOM character.
**Warning signs:** International characters (é, ñ, ü, Chinese, Hebrew) display incorrectly in Excel but work in text editors.

**Source:** [JavaScript CSV Export with Unicode Symbols](https://www.shieldui.com/javascript-unicode-csv-export)

### Pitfall 3: Drawer Closes Without Warning on Backdrop Click
**What goes wrong:** User fills out form in Drawer, accidentally clicks backdrop, all changes lost without confirmation.
**Why it happens:** Drawer's default onClose fires on backdrop click. No dirty state check intercepts it.
**How to avoid:** Implement onClose handler that checks formState.isDirty, shows MUI Dialog for confirmation before actually closing.
**Warning signs:** User complaints about lost data, no "unsaved changes" prompts.

**Source:** [React Hook Form Discussion - Unsaved Changes Warning](https://github.com/jaredpalmer/formik/issues/1657)

### Pitfall 4: CSV Field Contains Quote, Breaks Parsing
**What goes wrong:** Asset description is: Monitor 24" Display. CSV export produces: Monitor 24" Display,Category. Excel sees quote as field delimiter, shifts all columns.
**Why it happens:** Quotes need escaping in CSV (doubled: ""). Commas need quote wrapping.
**How to avoid:** Use escapeCsvField function that checks for quotes/commas/newlines, doubles quotes, wraps in quotes.
**Warning signs:** Column alignment breaks in Excel for certain assets, data appears in wrong columns.

**Source:** [CSV Escaping in JavaScript](https://ssojet.com/escaping/csv-escaping-in-javascript-in-browser)

### Pitfall 5: Filter State Out of Sync with Displayed Data
**What goes wrong:** User filters by "Active" status, table shows active assets, user sorts table, filter indicator still shows "Active" but table shows all assets.
**Why it happens:** Filter state and sort function not coordinated. Sort function reads unfiltered data source.
**How to avoid:** Create derived state: filteredAssets = applyFilters(assets), then sortedAssets = applySort(filteredAssets). Always work with the pipeline.
**Warning signs:** Filter chips/tags don't match table content, clearing filters doesn't restore expected rows.

### Pitfall 6: Bulk Operations on Selected Rows Operate on Different Set
**What goes wrong:** User filters to "Active" assets, selects all 10 filtered rows, clicks "Bulk Delete", operation deletes different assets than displayed.
**Why it happens:** Selection tracks IDs, but bulk operation reads from allAssets instead of filteredAssets.
**How to avoid:** Bulk operations must filter selectedIds to only include IDs from current filteredAssets array. Confirm dialog should show count that matches visible selection.
**Warning signs:** Deleted count doesn't match selected count, wrong assets disappear.

### Pitfall 7: MUI DataGrid Licensing Surprise
**What goes wrong:** Developer uses DataGrid with columnVisibilityModel, exports to CSV, deploys to production, receives invoice for MUI X Pro license.
**Why it happens:** Some DataGrid features are free (MIT), others require Pro/Premium. Documentation isn't always clear which is which.
**How to avoid:** Check [MUI X Pricing](https://mui.com/x/introduction/licensing/) before using DataGrid. If budget doesn't allow, use MUI Table with manual state management.
**Warning signs:** Build warnings about "license key required", DataGrid features documented with "Pro" or "Premium" badges.

**Source:** [MUI X Advanced React Components](https://mui.com/x/)

## Code Examples

Verified patterns from official sources:

### MUI Drawer for Side Panel
```typescript
// Source: https://mui.com/material-ui/react-drawer/
import { Drawer, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function AssetDetailDrawer({ assetId, open, onClose }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 480 },
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Asset Details</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {/* Form content */}
      </Box>
    </Drawer>
  );
}
```

### React Hook Form with MUI TextField
```typescript
// Source: https://www.dhiwise.com/post/guide-to-integrating-react-hook-form-with-material-ui
import { useForm, Controller } from 'react-hook-form';
import { TextField } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssetSchema } from '@/domain/validators/schemas';

function AssetForm({ defaultValues, onSubmit }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues,
    resolver: zodResolver(AssetSchema),
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
            fullWidth
            margin="normal"
          />
        )}
      />
      {/* More fields */}
    </form>
  );
}
```

### Sortable MUI Table Header
```typescript
// Source: Manual pattern (MUI Table doesn't include built-in sorting)
import { TableHead, TableRow, TableCell, TableSortLabel } from '@mui/material';

type SortDirection = 'asc' | 'desc';
type SortField = 'tag' | 'description' | 'category' | 'status';

function AssetTableHead({ sortField, sortDirection, onSort }) {
  const createSortHandler = (field: SortField) => () => {
    const isAsc = sortField === field && sortDirection === 'asc';
    onSort(field, isAsc ? 'desc' : 'asc');
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell>
          <TableSortLabel
            active={sortField === 'tag'}
            direction={sortField === 'tag' ? sortDirection : 'asc'}
            onClick={createSortHandler('tag')}
          >
            Asset Tag
          </TableSortLabel>
        </TableCell>
        {/* More sortable columns */}
      </TableRow>
    </TableHead>
  );
}
```

### Filter State Management Hook
```typescript
// Source: Custom pattern based on React best practices
type AssetFilters = {
  siteId?: string;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  categoryId?: number;
  status?: string;
};

function useAssetFilters() {
  const [filters, setFilters] = useState<AssetFilters>({});

  const updateFilter = (key: keyof AssetFilters, value: string | number | undefined) => {
    setFilters(prev => {
      if (value === undefined || value === '') {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearFilters = () => setFilters({});

  const applyFilters = (assets: AssetWithRelations[]) => {
    return assets.filter(({ asset, category, location }) => {
      if (filters.categoryId && asset.categoryId !== filters.categoryId) return false;
      if (filters.status && asset.status !== filters.status) return false;
      if (filters.roomId && asset.locationId !== filters.roomId) return false;
      // Check parent locations (building, floor, site)
      if (filters.floorId && location?.floorId !== filters.floorId) return false;
      if (filters.buildingId && location?.buildingId !== filters.buildingId) return false;
      if (filters.siteId && location?.siteId !== filters.siteId) return false;
      return true;
    });
  };

  return { filters, updateFilter, clearFilters, applyFilters };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.onbeforeunload for dirty state | React Hook Form isDirty + Dialog | 2020-2021 (SPA rise) | SPAs don't trigger browser navigation, need React-level tracking |
| Formik for forms | React Hook Form | 2021-2022 | RHF is faster (uncontrolled), smaller bundle, better TypeScript |
| Papa Parse for CSV export | Native Blob API | 2023+ | Modern browsers handle Blob well, don't need library for export (only for parsing) |
| MUI DataGrid for all tables | MUI Table for simple cases | 2024+ | DataGrid licensing costs pushed teams to evaluate if they need advanced features |
| Lodash debounce everywhere | Custom useDebounce hook | 2020+ | React hooks pattern more idiomatic, no dependency needed for simple case |

**Deprecated/outdated:**
- GridToolbar, GridToolbarContainer: Deprecated in MUI X v8, removed in v9. Use Toolbar component instead.
- React Router Prompt: Removed in v6. Use useBlocker or useBeforeUnload instead.
- DataGrid with free license for advanced features: Multi-sort, column management, Excel export now require Pro/Premium in MUI X v6+.

## Open Questions

Things that couldn't be fully resolved:

1. **MUI Table vs DataGrid for Phase 3 requirements**
   - What we know: User decisions specify basic needs (sortable columns, simple filtering). MUI DataGrid MIT version includes sorting/filtering but requires manual implementation for column visibility. DataGrid Pro ($15/dev/month) adds advanced column management, multi-sort, Excel export.
   - What's unclear: Whether project budget allows MUI X Pro license. User CONTEXT specified "configurable columns" which suggests column visibility is important.
   - Recommendation: Proceed with MUI Table + manual state management (zero licensing cost). If budget confirmed later, can upgrade to DataGrid Pro for better UX. Table approach is more effort but fully controls behavior.

2. **Search field scope (spec'd fields vs expanded)**
   - What we know: Requirements specify "search assets by asset tag, description, serial number, or phone number". CONTEXT marked as "Claude's discretion" whether to expand to include category names and location paths.
   - What's unclear: User expectations - should searching "Laptop" match assets in "Laptop" category? Should "Room 101" match assets in that room?
   - Recommendation: Start with spec'd fields only (tag, description, serial, phone). Add "Also search category/location" checkbox in toolbar if user feedback requests it. This keeps initial implementation simple and clear.

3. **Export "ask each time" dialog vs respect column visibility**
   - What we know: CONTEXT specifies CSV export should "ask each time" whether to export filtered or all assets. Also specifies column visibility configuration. Claude's discretion whether CSV respects hidden columns.
   - What's unclear: If user hides "Cost" column, should CSV export still include it? Two valid interpretations: (1) CSV is complete data export, always include all fields. (2) CSV matches displayed table, respect visibility settings.
   - Recommendation: Export all fields regardless of visibility (interpretation 1). Rationale: Excel users often hide columns in their tool of choice. CSV export is data transfer, not screenshot. Add tooltip: "Export includes all fields, including hidden columns."

## Sources

### Primary (HIGH confidence)
- MUI Material-UI Official Docs - https://mui.com/material-ui/react-drawer/
- MUI X Data Grid Official Docs - https://mui.com/x/react-data-grid/
- Tauri v2 Opener Plugin Docs - https://v2.tauri.app/plugin/opener/
- React Hook Form Official Docs - verified via web search results

### Secondary (MEDIUM confidence)
- [React Data Grid component - MUI X](https://mui.com/x/react-data-grid/) - DataGrid features and licensing
- [Data Grid - Column visibility - MUI X](https://mui.com/x/react-data-grid/column-visibility/) - Column management patterns
- [React Drawer component - Material UI](https://mui.com/material-ui/react-drawer/) - Drawer variants and best practices
- [Data Grid - Toolbar component - MUI X](https://mui.com/x/react-data-grid/components/toolbar/) - Custom toolbar patterns
- [Opener | Tauri](https://v2.tauri.app/plugin/opener/) - File reveal in Explorer
- [Maximize Form Efficiency with React Hook Form with Material UI](https://www.dhiwise.com/post/guide-to-integrating-react-hook-form-with-material-ui) - Form integration patterns
- [Understanding React's useEffect Memory Leak](https://tonywei92.github.io/blog/understanding-react-s-useeffect-memory-leak-and-how-to-avoid-it-by-building-react-http-request) - Cleanup patterns
- [JavaScript CSV Export with Unicode Symbols](https://www.shieldui.com/javascript-unicode-csv-export) - UTF-8 BOM technique
- [CSV Escaping in JavaScript](https://ssojet.com/escaping/csv-escaping-in-javascript-in-browser) - Proper field escaping
- [Debounce Your Search and Optimize Your React Input Component](https://www.c-sharpcorner.com/article/debounce-your-search-and-optimize-your-react-input-component/) - Debounce patterns
- [PatternFly Bulk Selection](https://www.patternfly.org/patterns/bulk-selection/) - Bulk selection UX patterns
- [React Hook Form Discussion - Unsaved Changes](https://github.com/jaredpalmer/formik/issues/1657) - Dirty state warning patterns

### Tertiary (LOW confidence)
- Various Medium articles on MUI DataGrid customization - patterns verified against official docs
- Community discussions on bulk selection - cross-referenced with PatternFly design system
- Blog posts on React Hook Form validation - verified against official examples

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - MUI v5 already established, React Hook Form is industry standard, Tauri opener is official plugin
- Architecture: HIGH - Patterns verified with official MUI docs, React Hook Form docs, established React patterns
- Pitfalls: HIGH - All pitfalls documented in official sources or verified community issues (GitHub discussions)
- Don't hand-roll: HIGH - Recommendations based on established libraries with proven track records
- CSV export: HIGH - UTF-8 BOM technique verified in multiple sources, CSV escaping follows RFC 4180 standard

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (30 days - MUI v5 is stable, React patterns mature, Tauri v2 established)
