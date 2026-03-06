import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

export interface CascadeDeleteOptions {
  cascade: boolean;
}

interface CascadeDeleteDialogProps {
  open: boolean;
  location: {
    id: string;
    name: string;
    childCount: number;
    assetCount: number;
  } | null;
  onClose: () => void;
  onConfirm: (options: CascadeDeleteOptions) => Promise<void>;
}

const CascadeDeleteDialog: React.FC<CascadeDeleteDialogProps> = ({
  open,
  location,
  onClose,
  onConfirm,
}) => {
  const [deleteChildren, setDeleteChildren] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm({ cascade: deleteChildren });
      setDeleteChildren(false); // Reset for next use
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setDeleteChildren(false);
      onClose();
    }
  };

  if (!location) return null;

  const hasChildren = location.childCount > 0;
  const hasAssets = location.assetCount > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Delete Location?
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography>
            Are you sure you want to delete <strong>{location.name}</strong>?
          </Typography>

          {hasChildren && (
            <Alert severity="warning">
              This location has <strong>{location.childCount}</strong> child location
              {location.childCount === 1 ? '' : 's'}.
            </Alert>
          )}

          {hasAssets && (
            <Alert severity="error">
              This location has <strong>{location.assetCount}</strong> asset
              {location.assetCount === 1 ? '' : 's'} assigned to it.
            </Alert>
          )}

          {hasChildren && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteChildren}
                  onChange={(e) => setDeleteChildren(e.target.checked)}
                />
              }
              label="Also delete all child locations (cascade delete)"
            />
          )}

          {hasAssets && !deleteChildren && hasChildren && (
            <Alert severity="info">
              Assets will become orphaned if you delete without cascade.
            </Alert>
          )}

          {hasAssets && deleteChildren && (
            <Alert severity="info">
              Assets in child locations will also become orphaned.
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              bgcolor: 'error.light',
              borderRadius: 1,
              color: 'error.contrastText',
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              This will delete:
            </Typography>
            <Typography variant="body2">
              • {deleteChildren && hasChildren ? location.childCount + 1 : 1} location
              {deleteChildren && hasChildren && location.childCount > 0 ? 's' : ''}
            </Typography>
            {hasAssets && (
              <Typography variant="body2">
                • {location.assetCount} orphaned asset
                {location.assetCount === 1 ? '' : 's'}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CascadeDeleteDialog;
