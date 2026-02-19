import { useState } from 'react';
import { useLayer } from 'react-laag';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { MarkerWithDetails } from '@/application/services/MarkerService';

interface MarkerEditPopupProps {
  markerDetails: MarkerWithDetails;
  anchorPosition: { x: number; y: number };
  onClose: () => void;
  onDelete: () => Promise<void>;
  onRelink: () => void;
}

/**
 * Popup component for editing linked markers in edit mode.
 *
 * Uses react-laag for edge-aware popup positioning. Provides Delete (with
 * inline confirmation step) and Change Asset (relink) actions.
 *
 * @param markerDetails - Marker with linked asset and category details
 * @param anchorPosition - Marker position in screen coordinates
 * @param onClose - Callback when popup closes
 * @param onDelete - Async callback to delete the marker
 * @param onRelink - Callback to open AssetLinkDialog in relink mode
 */
export function MarkerEditPopup({
  markerDetails,
  anchorPosition,
  onClose,
  onDelete,
  onRelink,
}: MarkerEditPopupProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { asset, category } = markerDetails;

  const { layerProps, renderLayer } = useLayer({
    isOpen: true,
    onOutsideClick: onClose,
    onDisappear: onClose,
    auto: true,
    placement: 'top-center',
    possiblePlacements: ['top-center', 'bottom-center', 'right-center', 'left-center'],
    triggerOffset: 10,
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error('[MarkerEditPopup] Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  return renderLayer(
    <div
      {...layerProps}
      style={{
        ...layerProps.style,
        zIndex: 1000,
      }}
    >
      <Card sx={{ minWidth: 260, maxWidth: 360, boxShadow: 3 }}>
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
          />
        </CardContent>

        <CardActions sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: 1, px: 2, pb: 2 }}>
          {/* Change Asset button */}
          <Button
            size="small"
            startIcon={<SwapHorizIcon />}
            onClick={onRelink}
            disabled={deleting}
          >
            Change Asset
          </Button>

          {/* Delete with inline confirmation */}
          {!confirmDelete ? (
            <Button
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
            >
              Delete Marker
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="error">
                Remove this marker?
              </Typography>
              <Button
                size="small"
                color="error"
                variant="contained"
                onClick={handleDelete}
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={12} /> : undefined}
              >
                Confirm
              </Button>
              <Button
                size="small"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </Box>
          )}
        </CardActions>
      </Card>
    </div>
  );
}
