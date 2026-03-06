import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import { CategoryData, LocationData } from '@/domain/validators';

interface AssetFilterPanelProps {
  assetTypes: CategoryData[];
  locations: LocationData[];
  filters: {
    categoryId?: number;
    locationId?: string;
    status?: string;
  };
  onChange: (filters: { categoryId?: number; locationId?: string; status?: string }) => void;
}

/**
 * AssetFilterPanel - Multi-dimensional asset filtering controls
 *
 * Provides dropdowns for:
 * - Asset Type (Category)
 * - Location
 * - Status
 *
 * Clear Filters button resets all filters to default state.
 */
export function AssetFilterPanel({
  assetTypes,
  locations,
  filters,
  onChange,
}: AssetFilterPanelProps) {
  const handleCategoryChange = (categoryId: number | '') => {
    onChange({
      ...filters,
      categoryId: categoryId === '' ? undefined : categoryId,
    });
  };

  const handleLocationChange = (locationId: string) => {
    onChange({
      ...filters,
      locationId: locationId === '' ? undefined : locationId,
    });
  };

  const handleStatusChange = (status: string) => {
    onChange({
      ...filters,
      status: status === '' ? undefined : status,
    });
  };

  const handleClearFilters = () => {
    onChange({});
  };

  const hasActiveFilters =
    filters.categoryId !== undefined ||
    filters.locationId !== undefined ||
    filters.status !== undefined;

  // Build hierarchical location labels
  const buildLocationLabel = (location: LocationData): string => {
    const path: string[] = [location.name];
    let current = location;

    while (current.parentId) {
      const parent = locations.find((loc) => loc.id === current.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }

    return path.join(' > ');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        {/* Asset Type Filter */}
        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Asset Type</InputLabel>
          <Select
            value={filters.categoryId ?? ''}
            onChange={(e) => handleCategoryChange(e.target.value as number | '')}
            label="Asset Type"
          >
            <MenuItem value="">All Types</MenuItem>
            {assetTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Location Filter */}
        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Location</InputLabel>
          <Select
            value={filters.locationId ?? ''}
            onChange={(e) => handleLocationChange(e.target.value)}
            label="Location"
          >
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.id} value={loc.id}>
                {buildLocationLabel(loc)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 150, flex: 1 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status ?? ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            label="Status"
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="decommissioned">Decommissioned</MenuItem>
            <MenuItem value="faulty">Faulty</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
          </Select>
        </FormControl>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={handleClearFilters}
            startIcon={<FilterIcon />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </Button>
        )}
      </Stack>
    </Box>
  );
}
