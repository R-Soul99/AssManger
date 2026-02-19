import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  Divider,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Asset } from '@/domain/entities';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { PlaceholderMarker } from './FloorPlanCanvas';
import { QuickCreateAssetForm } from './QuickCreateAssetForm';

interface AssetLinkDialogProps {
  open: boolean;
  floorPlanId: string;
  placeholder: PlaceholderMarker | null;
  onLink: (assetId: string) => Promise<void>; // parent calls placeMarker + refreshes
  onDiscard: () => void;                       // user dismissed without linking
  onClose: () => void;
}

export const AssetLinkDialog: React.FC<AssetLinkDialogProps> = ({
  open,
  floorPlanId: _floorPlanId,
  placeholder: _placeholder,
  onLink,
  onDiscard,
  onClose,
}) => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setShowCreateForm(false);
      setLinkError(null);
      loadAssets();
    }
  }, [open]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const assetRepo = RepositoryFactory.getInstance().getAssetRepository();
      const assets = await assetRepo.findAll();
      setAllAssets(assets);
    } catch (err) {
      console.error('[AssetLinkDialog] Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAsset = async (assetId: string) => {
    setLinking(true);
    setLinkError(null);
    try {
      await onLink(assetId);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AssetLinkDialog] Failed to link asset:', err);
      setLinkError(msg);
    } finally {
      setLinking(false);
    }
  };

  const handleClose = () => {
    if (!linking) {
      onDiscard();
      onClose();
    }
  };

  const filterOptions = createFilterOptions<Asset>({
    stringify: (option) => `${option.tag} ${option.description}`,
    limit: 50,
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Link Marker to Asset
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 'normal' }}>
          Search for an existing asset, or create a new one below
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={linking}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {linkError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLinkError(null)}>
            {linkError}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !showCreateForm ? (
          <>
            <Autocomplete
              options={allAssets}
              getOptionLabel={(option) => `${option.tag} — ${option.description}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterOptions={filterOptions}
              disabled={linking}
              onChange={(_, selectedAsset) => {
                if (selectedAsset) handleLinkAsset(selectedAsset.id);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search assets"
                  placeholder="Type asset tag or description..."
                  autoFocus
                  margin="dense"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontWeight: 600 }}>{option.tag}</span>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">or</Typography>
            </Divider>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setShowCreateForm(true)}
              variant="outlined"
              fullWidth
              disabled={linking}
            >
              Create a new asset
            </Button>
          </>
        ) : (
          <QuickCreateAssetForm
            onAssetCreated={(assetId) => {
              setShowCreateForm(false);
              handleLinkAsset(assetId);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
