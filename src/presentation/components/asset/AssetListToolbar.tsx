import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Typography,
  IconButton,
  Menu,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterListOff as ClearIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { CategoryData, LocationData } from '@/domain/validators';
import { useAssetFilters } from './hooks/useAssetFilters';
import { ColumnConfig, ColumnKey } from './hooks/useColumnVisibility';

interface AssetListToolbarProps {
  filters: ReturnType<typeof useAssetFilters>['filters'];
  onFilterChange: (key: any, value: any) => void;
  onClearFilters: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categories: CategoryData[];
  locations: LocationData[];
  assetCount: number;
  filteredCount: number;
  // Column visibility
  columns: ColumnConfig[];
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (key: ColumnKey) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'decommissioned', label: 'Decommissioned' },
  { value: 'faulty', label: 'Faulty' },
  { value: 'maintenance', label: 'Maintenance' },
];

export const AssetListToolbar: React.FC<AssetListToolbarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  searchTerm,
  onSearchChange,
  categories,
  locations,
  assetCount,
  filteredCount,
  columns,
  visibleColumns,
  onToggleColumn,
}) => {
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);

  // Helper to filter locations by type and parent
  const getLocations = (type: 'site' | 'building' | 'floor' | 'room', parentId?: string) => {
    return locations.filter(
      (l) => l.type === type && (!parentId || l.parentId === parentId)
    );
  };

  const sites = getLocations('site');
  const buildings = getLocations('building', filters.siteId);
  const floors = getLocations('floor', filters.buildingId);
  const rooms = getLocations('room', filters.floorId);

  const hasActiveFilters = Object.keys(filters).length > 0 || searchTerm.length > 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        {/* Search */}
        <TextField
          placeholder="Search assets..."
          size="small"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* Category Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.categoryId || ''}
            label="Category"
            onChange={(e) => onFilterChange('categoryId', e.target.value || undefined)}
          >
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ''}
            label="Status"
            onChange={(e) => onFilterChange('status', e.target.value || undefined)}
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Clear Button */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            size="small"
          >
            Clear
          </Button>
        )}

        {/* Column Visibility Toggle */}
        <IconButton
          onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
          title="Column visibility"
          size="small"
        >
          <ViewColumnIcon />
        </IconButton>

        <Menu
          anchorEl={columnMenuAnchor}
          open={Boolean(columnMenuAnchor)}
          onClose={() => setColumnMenuAnchor(null)}
        >
          {columns.map((col) => (
            <MenuItem key={col.key} onClick={() => onToggleColumn(col.key)}>
              <Checkbox checked={!!visibleColumns[col.key]} size="small" />
              <ListItemText primary={col.label} />
            </MenuItem>
          ))}
        </Menu>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        {/* Location Hierarchy Filters */}
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 60 }}>
          Location:
        </Typography>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Site</InputLabel>
          <Select
            value={filters.siteId || ''}
            label="Site"
            onChange={(e) => {
              onFilterChange('siteId', e.target.value || undefined);
              // Reset children
              onFilterChange('buildingId', undefined);
              onFilterChange('floorId', undefined);
              onFilterChange('roomId', undefined);
            }}
          >
            <MenuItem value=""><em>Any</em></MenuItem>
            {sites.map((l) => (
              <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }} disabled={!filters.siteId}>
          <InputLabel>Building</InputLabel>
          <Select
            value={filters.buildingId || ''}
            label="Building"
            onChange={(e) => {
              onFilterChange('buildingId', e.target.value || undefined);
              onFilterChange('floorId', undefined);
              onFilterChange('roomId', undefined);
            }}
          >
            <MenuItem value=""><em>Any</em></MenuItem>
            {buildings.map((l) => (
              <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }} disabled={!filters.buildingId}>
          <InputLabel>Floor</InputLabel>
          <Select
            value={filters.floorId || ''}
            label="Floor"
            onChange={(e) => {
              onFilterChange('floorId', e.target.value || undefined);
              onFilterChange('roomId', undefined);
            }}
          >
            <MenuItem value=""><em>Any</em></MenuItem>
            {floors.map((l) => (
              <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }} disabled={!filters.floorId}>
          <InputLabel>Room</InputLabel>
          <Select
            value={filters.roomId || ''}
            label="Room"
            onChange={(e) => onFilterChange('roomId', e.target.value || undefined)}
          >
            <MenuItem value=""><em>Any</em></MenuItem>
            {rooms.map((l) => (
              <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="body2" color="text.secondary">
          Showing {filteredCount} of {assetCount} assets
        </Typography>
      </Stack>
    </Box>
  );
};
