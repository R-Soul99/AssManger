import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { FloorPlanService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';

interface FloorPlanDeleteDialogProps {
  open: boolean;
  floorPlanId: string;
  floorPlanName: string;
  markerCount: number;
  onClose: () => void;
  onDeleted: () => void;
}

export function FloorPlanDeleteDialog({
  open,
  floorPlanId,
  floorPlanName,
  markerCount,
  onClose,
  onDeleted,
}: FloorPlanDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const floorPlanService = new FloorPlanService(
        RepositoryFactory.getInstance().getFloorPlanRepository()
      );

      const result = await floorPlanService.deleteFloorPlan(floorPlanId);

      if (!result.success) {
        throw new Error(result.error);
      }

      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete floor plan');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Floor Plan</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete <strong>{floorPlanName}</strong>?
        </Typography>

        {markerCount > 0 && (
          <Alert severity="warning">
            This floor plan has {markerCount} asset marker{markerCount !== 1 ? 's' : ''} placed on it.
            Deleting will remove these markers.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} /> : null}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
