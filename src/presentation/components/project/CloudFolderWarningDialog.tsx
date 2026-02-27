import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface CloudFolderWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  detectedProvider: string;
  detectedPath: string;
  recommendedPath: string;
}

/**
 * Warning dialog shown when user attempts to create/open database in cloud-synced folder.
 * Per FOUND-07 requirement: warn about SQLite corruption risks from cloud sync conflicts.
 */
export const CloudFolderWarningDialog: React.FC<CloudFolderWarningDialogProps> = ({
  open,
  onClose,
  onProceed,
  detectedProvider,
  detectedPath,
  recommendedPath,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          Cloud Sync Folder Detected
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This database will be stored in <strong>{detectedProvider}</strong>
        </Alert>

        <Typography variant="body2" paragraph>
          <strong>Path:</strong> {detectedPath}
        </Typography>

        <Typography variant="body2" paragraph>
          SQLite databases can become corrupted when synced across devices due to file locking conflicts.
          Cloud sync services interrupt database writes, which can lead to data loss or database corruption.
        </Typography>

        <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Recommended Alternative:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {recommendedPath}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onProceed} color="warning" variant="contained">
          Proceed Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
};
