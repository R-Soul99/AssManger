import { Box, Typography } from '@mui/material';

interface CanvasPlaceholderProps {
  selectedLocationId: string | null;
}

/**
 * CanvasPlaceholder - Placeholder for floor plan canvas
 *
 * Pattern 0.5 from 02-RESEARCH.md
 *
 * Shows contextual messages based on whether a location is selected:
 * - No location selected: "No floor plan loaded"
 * - Location selected: "Floor plan display coming in Phase 4"
 *
 * This placeholder will be replaced with the actual canvas
 * component in Phase 4 (Floor Plan Management).
 */
export function CanvasPlaceholder({ selectedLocationId }: CanvasPlaceholderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
      }}
    >
      <Typography variant="h5" color="text.secondary">
        {selectedLocationId === null
          ? 'No floor plan loaded'
          : 'Floor plan display coming in Phase 4'}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {selectedLocationId === null
          ? 'Select a location from the tree to view its floor plan'
          : 'Canvas rendering will be implemented in Phase 4'}
      </Typography>
    </Box>
  );
}
