import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { FloorPlanService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import {
  pickFloorPlanImage,
  loadAndConvertImage,
  saveConvertedImage,
  ConvertedImage,
} from './utils/imageUtils';

interface FloorPlanImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void; // Callback to refresh list after import
}

type ImportPhase = 'pick' | 'processing' | 'preview' | 'saving' | 'error';

export function FloorPlanImportDialog({
  open,
  onClose,
  onImported,
}: FloorPlanImportDialogProps) {
  const [phase, setPhase] = useState<ImportPhase>('pick');
  const [convertedImage, setConvertedImage] = useState<ConvertedImage | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPhase('pick');
      setConvertedImage(null);
      setName('');
      setError(null);
    }
  }, [open]);

  // Cleanup preview URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (convertedImage?.previewUrl) {
        URL.revokeObjectURL(convertedImage.previewUrl);
      }
    };
  }, [convertedImage]);

  const handlePickFile = async () => {
    try {
      const picked = await pickFloorPlanImage();
      if (!picked) return; // User cancelled

      setPhase('processing');
      setError(null);

      const converted = await loadAndConvertImage(picked.data, picked.fileName);

      // Default name is filename without extension
      const defaultName = picked.fileName.replace(/\.[^.]+$/, '');
      setName(defaultName);
      setConvertedImage(converted);
      setPhase('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setPhase('error');
    }
  };

  const handleImport = async () => {
    if (!convertedImage) return;

    try {
      setPhase('saving');
      setError(null);

      // Save image file
      const relativePath = await saveConvertedImage(
        convertedImage.blob,
        convertedImage.outputName
      );

      // Create floor plan record (no location assigned yet)
      const floorPlanService = new FloorPlanService(
        RepositoryFactory.getInstance().getFloorPlanRepository()
      );

      const result = await floorPlanService.importFloorPlan({
        name: name.trim() || 'Untitled Floor Plan',
        imageRelativePath: relativePath,
        imageWidth: convertedImage.width,
        imageHeight: convertedImage.height,
        // locationId omitted - assigned later
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onImported();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import floor plan');
      setPhase('error');
    }
  };

  const handleClose = () => {
    // Cleanup preview URL
    if (convertedImage?.previewUrl) {
      URL.revokeObjectURL(convertedImage.previewUrl);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Floor Plan</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {phase === 'pick' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Select an image file (PNG, JPEG, BMP, or TIFF)
            </Typography>
            <Button variant="contained" onClick={handlePickFile}>
              Choose File
            </Button>
          </Box>
        )}

        {phase === 'processing' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Processing image...
            </Typography>
          </Box>
        )}

        {phase === 'preview' && convertedImage && (
          <Box>
            <Box
              sx={{
                width: '100%',
                height: 200,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'grey.100',
                borderRadius: 1,
                mb: 2,
                overflow: 'hidden',
              }}
            >
              <img
                src={convertedImage.previewUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {convertedImage.width} x {convertedImage.height} pixels
            </Typography>
            <TextField
              label="Floor Plan Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              helperText="Optional - defaults to filename if left blank"
            />
          </Box>
        )}

        {phase === 'saving' && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Saving floor plan...
            </Typography>
          </Box>
        )}

        {phase === 'error' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Button variant="outlined" onClick={() => setPhase('pick')}>
              Try Again
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {phase === 'preview' && (
          <Button variant="contained" onClick={handleImport}>
            Import
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
