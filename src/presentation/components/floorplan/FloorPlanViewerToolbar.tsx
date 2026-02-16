import { Box, Chip, IconButton, Button, Typography, Divider } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckIcon from '@mui/icons-material/Check';
import { Category } from '@/domain/entities';

interface FloorPlanViewerToolbarProps {
  categories: Category[];
  visibleCategories: Set<number>;
  onToggleCategory: (categoryId: number) => void;
  onToggleSidebar: () => void;
}

/**
 * Toolbar component for floor plan viewer with category visibility toggles.
 *
 * Features:
 * - Category toggle chips with colors
 * - Filter sidebar toggle button
 * - Select All / Deselect All buttons
 *
 * @param categories - All categories present in markers
 * @param visibleCategories - Currently visible category IDs
 * @param onToggleCategory - Callback to toggle category visibility
 * @param onToggleSidebar - Callback to open/close filter sidebar
 */
export function FloorPlanViewerToolbar({
  categories,
  visibleCategories,
  onToggleCategory,
  onToggleSidebar,
}: FloorPlanViewerToolbarProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 80, // Move right to make room for back button
        right: 80, // Don't overlap with zoom controls
        backgroundColor: 'white',
        padding: 2,
        borderRadius: 1,
        boxShadow: 2,
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
        zIndex: 1000,
      }}
    >
      {/* Filter sidebar toggle button */}
      <IconButton
        size="small"
        onClick={onToggleSidebar}
        title="Toggle Filters"
        aria-label="Toggle filter sidebar"
      >
        <FilterListIcon />
      </IconButton>

      <Divider orientation="vertical" flexItem />

      {/* Category toggle chips */}
      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
        Categories:
      </Typography>

      {categories.map((category) => {
        const isVisible = visibleCategories.has(category.id);
        return (
          <Chip
            key={category.id}
            label={category.name}
            size="small"
            onClick={() => onToggleCategory(category.id)}
            onDelete={isVisible ? () => onToggleCategory(category.id) : undefined}
            deleteIcon={isVisible ? <CheckIcon /> : undefined}
            sx={{
              backgroundColor: isVisible ? category.color : '#e0e0e0',
              color: isVisible ? '#fff' : '#666',
              '& .MuiChip-deleteIcon': {
                color: '#fff',
              },
              cursor: 'pointer',
            }}
          />
        );
      })}

      {/* Select All / Deselect All buttons */}
      <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
        <Button
          size="small"
          variant="text"
          onClick={() => {
            categories.forEach((c) => {
              if (!visibleCategories.has(c.id)) onToggleCategory(c.id);
            });
          }}
        >
          All
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={() => {
            categories.forEach((c) => {
              if (visibleCategories.has(c.id)) onToggleCategory(c.id);
            });
          }}
        >
          None
        </Button>
      </Box>
    </Box>
  );
}
