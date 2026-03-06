import { Box, Typography } from '@mui/material';
import { Location } from '@/domain/entities/Location';
import { Asset } from '@/domain/entities/Asset';

/**
 * Discriminated union for type-safe state management
 *
 * Pattern 0.2 from 02-RESEARCH.md
 *
 * This ensures exhaustiveness checking at compile time
 * and prevents runtime errors from missing state cases.
 */
type DetailsPanelState =
  | { type: 'empty' }
  | { type: 'location'; data: Location }
  | { type: 'asset'; data: Asset };

interface DetailsPanelProps {
  state: DetailsPanelState;
}

/**
 * DetailsPanel - Right panel showing details of selected entity
 *
 * Pattern 0.2 from 02-RESEARCH.md
 *
 * Uses discriminated union with exhaustiveness checking to ensure
 * all state cases are handled. This prevents runtime errors and
 * makes refactoring safer.
 *
 * Current implementation shows placeholders for location and asset
 * states. Full detail views will be implemented in Phase 3.
 */
export function DetailsPanel({ state }: DetailsPanelProps) {
  return (
    <Box sx={{ p: 2 }}>
      {/* Exhaustiveness checking via switch with explicit cases */}
      {(() => {
        switch (state.type) {
          case 'empty':
            return (
              <Typography variant="body2" color="text.secondary">
                Select a location or asset to view details
              </Typography>
            );

          case 'location':
            return (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Location Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Name: {state.data.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Full details view coming in Phase 3
                </Typography>
              </Box>
            );

          case 'asset':
            return (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Asset Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tag: {state.data.tag}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Full details view coming in Phase 3
                </Typography>
              </Box>
            );

          default:
            // Exhaustiveness check: TypeScript will error if new state types are added
            // but not handled above. This makes refactoring safer.
            const _exhaustiveCheck: never = state;
            return _exhaustiveCheck;
        }
      })()}
    </Box>
  );
}
