import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';

interface DeleteAssetDialogProps {
  open: boolean;
  asset: { id: string; tag: string; description: string } | null;
  onClose: () => void;
  onConfirm: (assetId: string) => Promise<void>;
}

/**
 * DeleteAssetDialog - Confirmation dialog for asset deletion
 *
 * Shows asset tag and description to confirm the user is deleting
 * the correct asset. Includes warning about irreversibility.
 */
export function DeleteAssetDialog({ open, asset, onClose, onConfirm }: DeleteAssetDialogProps) {
  const handleConfirm = async () => {
    if (asset) {
      await onConfirm(asset.id);
      onClose();
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Asset?</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone
        </Alert>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete this asset?
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Tag:</strong> {asset.tag}
        </Typography>
        <Typography variant="body2">
          <strong>Description:</strong> {asset.description}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
