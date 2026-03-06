import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Location } from '@/domain/entities/Location';
import { Asset } from '@/domain/entities/Asset';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import { CategoryData, LocationData } from '@/domain/validators';
import { AssetSearchBar, AssetFilterPanel, AssetListView } from '@/presentation/components/asset';

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
  | {
      type: 'location';
      data: Location;
      assets: AssetWithRelations[];
      assetTypes: CategoryData[];
      locations: LocationData[];
      searchTerm: string;
      filters: { categoryId?: number; locationId?: string; status?: string };
      onSearch: (term: string) => void;
      onFilterChange: (filters: { categoryId?: number; locationId?: string; status?: string }) => void;
      onCreateAsset: () => void;
      onEditAsset: (id: string) => void;
      onDeleteAsset: (id: string) => void;
      loading?: boolean;
    }
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
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Location Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" gutterBottom>
                    {state.data.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {state.assets.length} asset(s)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={state.onCreateAsset}
                    variant="outlined"
                  >
                    Add Asset
                  </Button>
                </Box>

                {/* Asset Management UI */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <AssetSearchBar
                      value={state.searchTerm}
                      onChange={state.onSearch}
                    />
                  </Box>
                  <AssetFilterPanel
                    assetTypes={state.assetTypes}
                    locations={state.locations}
                    filters={state.filters}
                    onChange={state.onFilterChange}
                  />
                  <AssetListView
                    assets={state.assets}
                    loading={state.loading || false}
                    onEdit={state.onEditAsset}
                    onDelete={state.onDeleteAsset}
                    onCreate={state.onCreateAsset}
                  />
                </Box>
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
