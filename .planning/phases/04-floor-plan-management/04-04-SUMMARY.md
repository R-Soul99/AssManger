---
phase: 04-floor-plan-management
plan: 04
subsystem: floor-plan-ui
tags: [delete-safety, bulk-actions, marker-warnings, ui, mui]
dependency-graph:
  requires:
    - "04-03: Floor plan list with marker counts"
    - "FloorPlanService.deleteFloorPlan"
    - "IFloorPlanRepository.getMarkerCount"
  provides:
    - "FloorPlanDeleteDialog: single delete with marker warning"
    - "FloorPlanBulkActions: bulk selection toolbar and stepped deletion"
    - "Selection mode in FloorPlanList"
  affects:
    - "05: Floor plan viewer will use same selection patterns"
tech-stack:
  added: []
  patterns:
    - "Sequential deletion loop (SQLite write safety)"
    - "Stepped per-plan confirmation for plans with markers"
    - "Selection mode toggle pattern"
    - "Checkbox overlay for card selection"
decisions:
  - key: "sequential-delete-loop"
    choice: "Sequential delete loop instead of Promise.all"
    rationale: "SQLite write safety, simpler error handling"
    context: "Bulk delete operations"
  - key: "stepped-marker-warnings"
    choice: "Step through each plan with markers individually"
    rationale: "User needs to see marker count per plan before confirming deletion"
    context: "Bulk delete of plans with markers"
  - key: "selection-mode-toggle"
    choice: "Explicit selection mode (button toggle) instead of always-on checkboxes"
    rationale: "Cleaner UI when not selecting, prevents accidental selections"
    context: "Floor plan card selection"
key-files:
  created:
    - "src/presentation/components/floorplan/FloorPlanDeleteDialog.tsx"
    - "src/presentation/components/floorplan/FloorPlanBulkActions.tsx"
  modified:
    - "src/presentation/components/floorplan/FloorPlanCard.tsx"
    - "src/presentation/components/floorplan/FloorPlanList.tsx"
    - "src/presentation/components/floorplan/FloorPlanDetailView.tsx"
    - "src/presentation/components/floorplan/index.ts"
metrics:
  duration: "5min"
  completed: "2026-02-07"
---

# Phase 04 Plan 04: Floor Plan Delete Safety Summary

**One-liner:** Safe deletion workflow with per-plan marker warnings and bulk selection with stepped confirmation dialogs.

## What Was Built

### Components Created

**FloorPlanDeleteDialog**
- Single floor plan deletion confirmation
- Shows marker count if plan has markers
- Warning: "This floor plan has N asset markers placed on it. Deleting will remove these markers."
- Error handling with Alert display
- CircularProgress during deletion

**FloorPlanBulkActions**
- Bulk selection toolbar with selected count
- Delete Selected button triggers multi-step flow
- Initial confirmation: "Are you sure you want to delete N floor plans?"
- Steps through each plan with markers individually
- Per-plan dialog shows: plan name, marker count, Skip/Delete/Cancel All buttons
- Sequential delete loop (SQLite write safety)
- Progress indicator with CircularProgress and LinearProgress
- Completion summary shows deleted/skipped counts

### Components Modified

**FloorPlanCard**
- Added `selected` and `onSelectionToggle` props
- Checkbox overlay in top-right corner (only visible in selection mode)
- Selected state with primary border (2px vs 1px)
- Click behavior adapts to mode:
  - Selection mode: toggles selection
  - Normal mode: opens detail view
- Checkbox click stops propagation

**FloorPlanList**
- Selection mode toggle button ("Select" / "Exit Selection")
- FloorPlanBulkActions toolbar displays when in selection mode
- Tracks selected plan IDs in Set
- Passes selection props to both sortable and non-sortable cards
- Clears selection on delete complete

**FloorPlanDetailView**
- Delete Floor Plan button in header
- Loads marker count on mount
- FloorPlanDeleteDialog integration
- Navigates back to list after successful deletion

## Technical Implementation

### Delete Flow (Single)

1. User clicks "Delete Floor Plan" in detail view
2. FloorPlanDeleteDialog opens
3. If plan has markers, shows warning with count
4. User confirms
5. FloorPlanService.deleteFloorPlan called
6. On success: close dialog, trigger onUpdated, navigate back

### Delete Flow (Bulk)

1. User clicks "Select" button → enters selection mode
2. User clicks cards to select (checkboxes appear)
3. FloorPlanBulkActions toolbar appears showing count
4. User clicks "Delete Selected"
5. Initial confirmation dialog: "Are you sure you want to delete N floor plans?"
6. User clicks "Continue"
7. For each plan with markers:
   - Show individual warning dialog with plan name and marker count
   - User can: Skip (remove from delete list), Delete (continue), Cancel All (abort)
8. After all confirmations (or direct if no markers):
   - Show "Deleting..." dialog with progress
   - Sequential loop deletes each plan (SQLite write safety)
   - Update progress bar and current plan name
9. Completion dialog shows: deleted count, skipped count
10. User clicks "Close" → exit selection mode, refresh list

### Selection Mode Pattern

```typescript
// State
const [selectionMode, setSelectionMode] = useState(false);
const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

// Toggle selection mode
const handleToggleSelectionMode = () => {
  setSelectionMode((prev) => !prev);
  setSelectedPlanIds(new Set());
};

// Toggle individual selection
const handleSelectionToggle = (planId: string) => {
  setSelectedPlanIds((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(planId)) {
      newSet.delete(planId);
    } else {
      newSet.add(planId);
    }
    return newSet;
  });
};
```

### Conditional Card Behavior

```typescript
// Card click adapts to mode
const handleCardClick = () => {
  if (onSelectionToggle) {
    onSelectionToggle(plan.id);
  } else {
    onClick();
  }
};

// Checkbox only shown in selection mode
{onSelectionToggle && (
  <Checkbox
    checked={selected || false}
    onClick={handleCheckboxClick}
    sx={{ position: 'absolute', top: 8, right: 8 }}
  />
)}
```

## Success Criteria Met

- [x] Single floor plan delete shows warning dialog with marker count
- [x] Warning message: "This floor plan has N asset markers placed on it. Deleting will remove these markers."
- [x] Delete button in detail view triggers delete dialog
- [x] Multi-select via checkboxes on cards
- [x] Bulk actions toolbar shows selected count and Delete Selected button
- [x] Bulk delete initial confirmation: "Are you sure you want to delete N floor plans?"
- [x] Bulk delete steps through each plan with markers individually
- [x] Per-plan warning dialog shows: plan name, marker count, Skip/Delete/Cancel All buttons
- [x] Skip removes plan from deletion list without deleting
- [x] Cancel All aborts entire operation
- [x] Delete progress shows CircularProgress and count
- [x] Sequential delete loop (SQLite write safety)
- [x] Both database record and image file deleted (handled by FloorPlanRepository)
- [x] Completion shows deleted/skipped counts

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

### Upstream Dependencies
- `FloorPlanService.deleteFloorPlan`: Returns `ServiceResult<{ hadMarkers: boolean }>`
- `IFloorPlanRepository.getMarkerCount`: Returns number of markers for a floor plan
- `IFloorPlanRepository.hasMarkers`: Returns boolean for quick check

### Downstream Consumers
- Phase 05 (Floor Plan Viewer): Will likely use same selection mode pattern for marker operations
- Future: Potential reuse of FloorPlanBulkActions pattern for other bulk operations

## Testing Notes

**Manual verification checklist:**

1. Single delete without markers:
   - Click "Delete Floor Plan" in detail view
   - Verify dialog shows plan name
   - Verify no marker warning shown
   - Click "Delete"
   - Verify navigation back to list
   - Verify plan removed from list

2. Single delete with markers:
   - Create plan with markers (requires Phase 05 implementation)
   - Click "Delete Floor Plan"
   - Verify warning shows correct marker count
   - Click "Delete"
   - Verify plan and markers removed

3. Bulk delete without markers:
   - Click "Select" button
   - Select multiple plans (no markers)
   - Click "Delete Selected"
   - Verify initial confirmation shows count
   - Click "Continue"
   - Verify progress dialog appears
   - Verify completion summary shows deleted count

4. Bulk delete with markers:
   - Select mix of plans (some with markers, some without)
   - Click "Delete Selected"
   - Verify stepped dialogs for plans with markers
   - Test "Skip" button → plan not deleted
   - Test "Delete" button → plan deleted
   - Test "Cancel All" → no plans deleted
   - Verify completion summary shows deleted/skipped counts

5. Selection mode UX:
   - Verify checkboxes only appear in selection mode
   - Verify selected cards have primary border
   - Verify card click toggles selection (not opening detail view)
   - Verify "Clear Selection" clears all selections
   - Verify "Exit Selection" exits mode and clears selections

## Next Phase Readiness

**Phase 05 (Floor Plan Viewer) prerequisites met:**
- ✓ Floor plan deletion with marker cascade
- ✓ Selection mode pattern established
- ✓ Marker count display on cards

**Blockers/Concerns:**
- None

**Recommendations:**
- Consider reusing selection mode pattern for marker operations in Phase 05
- Bulk marker operations (delete all markers, move all markers) could follow same stepped confirmation pattern

---

## Commits

| Commit | Message |
|--------|---------|
| 5107e5a | feat(04-04): create FloorPlanDeleteDialog component |
| cd68bf3 | feat(04-04): create FloorPlanBulkActions component |
| 6eb611e | feat(04-04): update FloorPlanCard with selection checkbox |
| a7cc0d7 | feat(04-04): integrate bulk selection and delete in FloorPlanList |
| 8a18a1a | feat(04-04): add delete button to FloorPlanDetailView |

**Files changed:** 6 files (2 created, 4 modified)
**Lines changed:** +577 / -14

---

*Summary created: 2026-02-07*
*Duration: 5 minutes*
