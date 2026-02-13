import { Box, Drawer, List, ListItem, ListItemText, IconButton, Typography, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

interface FloorPlanFilterSidebarProps {
  open: boolean;
  selectedStatus: string | 'all';
  onStatusChange: (status: string | 'all') => void;
  onClose: () => void;
  markerCounts: { [status: string]: number };
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses', color: '#757575' },
  { value: 'active', label: 'Active', color: '#4caf50' },
  { value: 'pending', label: 'Pending', color: '#ff9800' },
  { value: 'maintenance', label: 'Maintenance', color: '#2196f3' },
  { value: 'faulty', label: 'Faulty', color: '#f44336' },
  { value: 'decommissioned', label: 'Decommissioned', color: '#9e9e9e' },
];

/**
 * Collapsible sidebar with status filters for floor plan viewer.
 *
 * Features:
 * - Status filter options with color-coded border
 * - Marker counts per status
 * - Visual indication of selected status
 * - Close button to hide sidebar
 *
 * @param open - Sidebar open/closed state
 * @param selectedStatus - Currently selected status filter
 * @param onStatusChange - Callback when status filter changes
 * @param onClose - Callback to close sidebar
 * @param markerCounts - Counts of markers per status
 */
export function FloorPlanFilterSidebar({
  open,
  selectedStatus,
  onStatusChange,
  onClose,
  markerCounts,
}: FloorPlanFilterSidebarProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          width: 300,
          padding: 2,
          marginTop: '64px', // Below app header if present
          height: 'calc(100vh - 64px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close filter sidebar">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Status Filter
      </Typography>

      <List>
        {STATUS_OPTIONS.map((option) => {
          const count =
            option.value === 'all'
              ? Object.values(markerCounts).reduce((sum, c) => sum + c, 0)
              : markerCounts[option.value] || 0;

          return (
            <ListItem
              key={option.value}
              button
              selected={selectedStatus === option.value}
              onClick={() => onStatusChange(option.value)}
              sx={{
                borderLeft: `4px solid ${option.color}`,
                mb: 0.5,
                borderRadius: 1,
              }}
            >
              <ListItemText
                primary={option.label}
                secondary={`${count} marker${count !== 1 ? 's' : ''}`}
              />
              {selectedStatus === option.value && <CheckIcon color="primary" />}
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Future filters can be added here */}
      <Typography variant="caption" color="text.secondary">
        Additional filters coming soon...
      </Typography>
    </Drawer>
  );
}
