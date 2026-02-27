import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { save } from '@tauri-apps/plugin-dialog';
import { copyFile } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';

interface BackupPromptDialogProps {
  open: boolean;
  databasePath: string;
  onBackupComplete: () => void;
  onSkipBackup: () => void;
  onCancel: () => void;
}

/**
 * Backup prompt dialog shown before running database migrations.
 * Per FOUND-05 requirement: prompt user to backup database before migrations.
 */
export const BackupPromptDialog: React.FC<BackupPromptDialogProps> = ({
  open,
  databasePath,
  onBackupComplete,
  onSkipBackup,
  onCancel,
}) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setError(null);

    try {
      // Get original filename
      const originalName = await basename(databasePath);
      const nameWithoutExt = originalName.replace(/\.(assetmap|db|sqlite)$/, '');

      // Generate suggested backup filename
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const suggestedName = `${nameWithoutExt}_backup_${timestamp}.assetmap`;

      // Show save dialog
      const backupPath = await save({
        defaultPath: suggestedName,
        filters: [
          {
            name: 'AssManger Database',
            extensions: ['assetmap', 'db', 'sqlite'],
          },
        ],
      });

      if (!backupPath) {
        // User cancelled save dialog
        setIsBackingUp(false);
        return;
      }

      // Copy database file to backup location
      await copyFile(databasePath, backupPath);

      // Show success message
      setShowSuccess(true);
      setIsBackingUp(false);

      // Proceed with migration after short delay
      setTimeout(() => {
        onBackupComplete();
      }, 1500);
    } catch (err) {
      console.error('[BackupPromptDialog] Backup failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create backup'
      );
      setIsBackingUp(false);
    }
  };

  const handleSkipBackup = () => {
    onSkipBackup();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <>
      <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoOutlinedIcon color="info" />
            Database Migration Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            This database needs to be updated to work with this version of AssManger.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            It's recommended to create a backup before proceeding.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Would you like to create a backup now?
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={isBackingUp}>
            Cancel
          </Button>
          <Button onClick={handleSkipBackup} color="warning" disabled={isBackingUp}>
            Skip Backup
          </Button>
          <Button
            onClick={handleCreateBackup}
            color="primary"
            variant="contained"
            disabled={isBackingUp}
            startIcon={isBackingUp ? <CircularProgress size={16} /> : null}
          >
            {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        message="Backup created successfully"
      />
    </>
  );
};
