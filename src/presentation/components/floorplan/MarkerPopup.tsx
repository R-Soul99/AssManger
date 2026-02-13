import { useLayer } from 'react-laag';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { Asset } from '@/domain/entities/Asset';
import { Category } from '@/domain/entities/Category';

interface MarkerPopupProps {
  asset: Asset;
  category: Category;
  anchorPosition: { x: number; y: number };
  onClose: () => void;
  onViewDetails: (assetId: string) => void;
}

/**
 * Popup component for displaying asset summary when marker is clicked.
 *
 * Uses react-laag for positioning with automatic edge detection to ensure
 * popup doesn't go off-screen. Displays asset name, tag, category, and status.
 *
 * @param asset - Asset entity to display
 * @param category - Category entity for styling
 * @param anchorPosition - Marker position in screen coordinates
 * @param onClose - Callback when popup closes
 * @param onViewDetails - Callback to open full asset detail view
 */
export function MarkerPopup({
  asset,
  category,
  anchorPosition,
  onClose,
  onViewDetails,
}: MarkerPopupProps) {
  const { layerProps, renderLayer } = useLayer({
    isOpen: true,
    onOutsideClick: onClose,
    onDisappear: onClose,
    auto: true, // Auto-adjust position for edge detection
    placement: 'top-center', // Prefer above marker
    possiblePlacements: ['top-center', 'bottom-center', 'right-center', 'left-center'],
    triggerOffset: 10, // 10px gap from marker
    trigger: {
      getBounds: () => ({
        left: anchorPosition.x,
        top: anchorPosition.y,
        width: 0,
        height: 0,
        right: anchorPosition.x,
        bottom: anchorPosition.y,
      }),
    },
  });

  return renderLayer(
    <div
      {...layerProps}
      style={{
        ...layerProps.style,
        zIndex: 1000,
      }}
    >
      <Card sx={{ minWidth: 250, maxWidth: 350, boxShadow: 3 }}>
        <CardContent>
          {/* Category indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: category.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            >
              {category.name[0]}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {category.name}
            </Typography>
          </Box>

          {/* Asset name */}
          <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
            {asset.description}
          </Typography>

          {/* Asset tag */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Tag: {asset.tag}
          </Typography>

          {/* Status badge */}
          <Chip
            label={asset.status.toUpperCase()}
            size="small"
            color={
              asset.status === 'active'
                ? 'success'
                : asset.status === 'faulty'
                  ? 'error'
                  : asset.status === 'maintenance'
                    ? 'warning'
                    : 'default'
            }
            sx={{ mb: 1 }}
          />

          {/* Optional fields */}
          {asset.serialNumber && (
            <Typography variant="body2" color="text.secondary">
              S/N: {asset.serialNumber}
            </Typography>
          )}
        </CardContent>

        <CardActions>
          <Button size="small" onClick={() => onViewDetails(asset.id)}>
            View Details
          </Button>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </CardActions>
      </Card>
    </div>
  );
}
