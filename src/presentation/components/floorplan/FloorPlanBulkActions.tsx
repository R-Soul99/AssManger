import { useState } from 'react';
import {
  Box,
  Button,
  Toolbar,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { Delete as DeleteIcon, Close as CloseIcon } from '@mui/icons-material';
import { FloorPlan } from '@/domain/entities';
import { FloorPlanService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';

interface FloorPlanBulkActionsProps {
  selectedPlans: FloorPlan[];
  markerCounts: { [floorPlanId: string]: number };
  onClearSelection: () => void;
  onDeleteComplete: () => void;
}

interface DeleteProgress {
  current: number;
  total: number;
  deleted: number;
  skipped: number;
  currentPlan: FloorPlan | null;
}

type DialogState =
  | { type: 'closed' }
  | { type: 'confirm-bulk' }
  | { type: 'confirm-individual'; planIndex: number }
  | { type: 'deleting' }
  | { type: 'complete'; deleted: number; skipped: number };

export function FloorPlanBulkActions({
  selectedPlans,
  markerCounts,
  onClearSelection,
  onDeleteComplete,
}: FloorPlanBulkActionsProps) {
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'closed' });
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress>({
    current: 0,
    total: 0,
    deleted: 0,
    skipped: 0,
    currentPlan: null,
  });
  const [error, setError] = useState<string | null>(null);

  // Tracks which plans to delete (allows skipping)
  const [plansToDelete, setPlansToDelete] = useState<FloorPlan[]>([]);

  const handleBulkDeleteClick = () => {
    setPlansToDelete([...selectedPlans]);
    setDialogState({ type: 'confirm-bulk' });
    setError(null);
  };

  const handleConfirmBulkDelete = () => {
    // Filter plans with markers - these need individual confirmation
    const plansWithMarkers = plansToDelete.filter(
      (p) => markerCounts[p.id] > 0
    );

    if (plansWithMarkers.length > 0) {
      // Start stepped deletion process
      setDialogState({ type: 'confirm-individual', planIndex: 0 });
    } else {
      // No markers, proceed directly to deletion
      performBulkDelete();
    }
  };

  const handleSkipPlan = () => {
    if (dialogState.type !== 'confirm-individual') return;

    const currentIndex = dialogState.planIndex;
    const plansWithMarkers = plansToDelete.filter((p) => markerCounts[p.id] > 0);

    // Remove current plan from deletion list
    const currentPlan = plansWithMarkers[currentIndex];
    setPlansToDelete((prev) => prev.filter((p) => p.id !== currentPlan.id));
    setDeleteProgress((prev) => ({ ...prev, skipped: prev.skipped + 1 }));

    // Move to next plan or start deletion
    if (currentIndex < plansWithMarkers.length - 1) {
      setDialogState({ type: 'confirm-individual', planIndex: currentIndex + 1 });
    } else {
      performBulkDelete();
    }
  };

  const handleDeleteCurrentPlan = () => {
    if (dialogState.type !== 'confirm-individual') return;

    const currentIndex = dialogState.planIndex;
    const plansWithMarkers = plansToDelete.filter((p) => markerCounts[p.id] > 0);

    // Move to next plan or start deletion
    if (currentIndex < plansWithMarkers.length - 1) {
      setDialogState({ type: 'confirm-individual', planIndex: currentIndex + 1 });
    } else {
      performBulkDelete();
    }
  };

  const handleCancelAll = () => {
    setDialogState({ type: 'closed' });
    setPlansToDelete([]);
    setDeleteProgress({
      current: 0,
      total: 0,
      deleted: 0,
      skipped: 0,
      currentPlan: null,
    });
    setError(null);
  };

  const performBulkDelete = async () => {
    setDialogState({ type: 'deleting' });
    setDeleteProgress({
      current: 0,
      total: plansToDelete.length,
      deleted: 0,
      skipped: deleteProgress.skipped,
      currentPlan: null,
    });
    setError(null);

    const floorPlanService = new FloorPlanService(
      RepositoryFactory.getInstance().getFloorPlanRepository()
    );

    let deleted = 0;

    // Sequential delete loop (SQLite write safety)
    for (let i = 0; i < plansToDelete.length; i++) {
      const plan = plansToDelete[i];
      setDeleteProgress((prev) => ({
        ...prev,
        current: i + 1,
        currentPlan: plan,
      }));

      try {
        const result = await floorPlanService.deleteFloorPlan(plan.id);
        if (result.success) {
          deleted++;
        } else {
          setError(`Failed to delete ${plan.name}: ${result.error}`);
          break;
        }
      } catch (err) {
        setError(
          `Failed to delete ${plan.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        break;
      }
    }

    setDeleteProgress((prev) => ({ ...prev, deleted }));
    setDialogState({ type: 'complete', deleted, skipped: deleteProgress.skipped });
  };

  const handleComplete = () => {
    setDialogState({ type: 'closed' });
    setPlansToDelete([]);
    setDeleteProgress({
      current: 0,
      total: 0,
      deleted: 0,
      skipped: 0,
      currentPlan: null,
    });
    setError(null);
    onClearSelection();
    onDeleteComplete();
  };

  if (selectedPlans.length === 0) {
    return null;
  }

  // Get current plan for individual confirmation
  const plansWithMarkers = plansToDelete.filter((p) => markerCounts[p.id] > 0);
  const currentPlan =
    dialogState.type === 'confirm-individual'
      ? plansWithMarkers[dialogState.planIndex]
      : null;

  return (
    <>
      <Toolbar
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          {selectedPlans.length} floor plan{selectedPlans.length !== 1 ? 's' : ''} selected
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleBulkDeleteClick}
          sx={{ mr: 1 }}
        >
          Delete Selected
        </Button>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={onClearSelection}
          sx={{ color: 'inherit', borderColor: 'inherit' }}
        >
          Clear Selection
        </Button>
      </Toolbar>

      {/* Initial bulk delete confirmation */}
      <Dialog
        open={dialogState.type === 'confirm-bulk'}
        onClose={handleCancelAll}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Floor Plans</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete {selectedPlans.length} floor plan
            {selectedPlans.length !== 1 ? 's' : ''}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAll}>Cancel</Button>
          <Button onClick={handleConfirmBulkDelete} color="error" variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Individual plan confirmation (for plans with markers) */}
      <Dialog
        open={dialogState.type === 'confirm-individual'}
        onClose={undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          {currentPlan && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{currentPlan.name}</strong>
              </Typography>
              <Alert severity="warning">
                This floor plan has {markerCounts[currentPlan.id]} asset marker
                {markerCounts[currentPlan.id] !== 1 ? 's' : ''} placed on it. Deleting will
                remove these markers.
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Plan {dialogState.type === 'confirm-individual' ? dialogState.planIndex + 1 : 0} of{' '}
                {plansWithMarkers.length} with markers
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAll}>Cancel All</Button>
          <Button onClick={handleSkipPlan} color="primary">
            Skip
          </Button>
          <Button onClick={handleDeleteCurrentPlan} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deletion in progress */}
      <Dialog open={dialogState.type === 'deleting'} maxWidth="sm" fullWidth>
        <DialogTitle>Deleting Floor Plans</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {deleteProgress.currentPlan && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Deleting: {deleteProgress.currentPlan.name}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body1">
              {deleteProgress.current} of {deleteProgress.total}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(deleteProgress.current / deleteProgress.total) * 100}
            sx={{ mt: 2 }}
          />
        </DialogContent>
      </Dialog>

      {/* Completion summary */}
      <Dialog open={dialogState.type === 'complete'} onClose={handleComplete} maxWidth="sm" fullWidth>
        <DialogTitle>Deletion Complete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {dialogState.type === 'complete' && (
              <>
                Deleted: {dialogState.deleted} floor plan{dialogState.deleted !== 1 ? 's' : ''}
                <br />
                Skipped: {dialogState.skipped} floor plan{dialogState.skipped !== 1 ? 's' : ''}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleComplete} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
