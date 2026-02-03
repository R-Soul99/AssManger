import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Typography,
  Alert,
  Box,
} from '@mui/material';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  filteredAssetCount: number;
  totalAssetCount: number;
  onExportAssets: (exportAll: boolean) => Promise<{ success: boolean; error?: string }>;
  onExportLocations: () => Promise<{ success: boolean; error?: string }>;
  onExportCategories: () => Promise<{ success: boolean; error?: string }>;
}

type AssetScope = 'filtered' | 'all';
type MessageType = 'success' | 'error';

interface ExportMessage {
  type: MessageType;
  text: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  filteredAssetCount,
  totalAssetCount,
  onExportAssets,
  onExportLocations,
  onExportCategories,
}) => {
  const [assetScope, setAssetScope] = useState<AssetScope>('filtered');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<ExportMessage | null>(null);

  const handleExportAssets = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const result = await onExportAssets(assetScope === 'all');
      if (result.success) {
        setMessage({ type: 'success', text: 'Assets exported successfully.' });
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Export failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
    setExporting(false);
  };

  const handleExportLocations = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const result = await onExportLocations();
      if (result.success) {
        setMessage({ type: 'success', text: 'Locations exported successfully.' });
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Export failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
    setExporting(false);
  };

  const handleExportCategories = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const result = await onExportCategories();
      if (result.success) {
        setMessage({ type: 'success', text: 'Categories exported successfully.' });
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Export failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    }
    setExporting(false);
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { minWidth: 380 } }}>
      <DialogTitle>Export Data</DialogTitle>
      <DialogContent>
        {/* Asset export section */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Assets</Typography>
        <RadioGroup
          value={assetScope}
          onChange={(e) => setAssetScope(e.target.value as AssetScope)}
        >
          <FormControlLabel
            value="filtered"
            control={<Radio size="small" />}
            label={`Export Filtered (${filteredAssetCount} asset${filteredAssetCount !== 1 ? 's' : ''})`}
          />
          <FormControlLabel
            value="all"
            control={<Radio size="small" />}
            label={`Export All (${totalAssetCount} asset${totalAssetCount !== 1 ? 's' : ''})`}
          />
        </RadioGroup>
        <Button
          variant="contained"
          size="small"
          disabled={exporting}
          onClick={handleExportAssets}
          sx={{ mt: 1 }}
        >
          Export Assets
        </Button>

        <Divider sx={{ my: 2 }} />

        {/* Other exports section */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Other Data</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            disabled={exporting}
            onClick={handleExportLocations}
          >
            Export Locations
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={exporting}
            onClick={handleExportCategories}
          >
            Export Categories
          </Button>
        </Box>

        {/* Feedback message */}
        {message && (
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{ mt: 2 }}
          >
            {message.text}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
