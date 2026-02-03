import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  DensityMedium as DensityMediumIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { AssetService } from '@/application/services/AssetService';
import { CsvExportService } from '@/application/services/CsvExportService';

interface AssetBulkActionsProps {
  selectedIds: string[];
  selectedAssets: AssetWithRelations[];
  filteredAssets: AssetWithRelations[];
  allAssets: AssetWithRelations[];
  onSelectionChange: (ids: string[]) => void;
  onBulkDelete: () => void;
}

export const AssetBulkActions: React.FC<AssetBulkActionsProps> = ({
  selectedIds,
  selectedAssets,
  filteredAssets,
  allAssets,
  onSelectionChange,
  onBulkDelete,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Menu open / close ──────────────────────────────────────────────
  const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // ── Selection helpers ──────────────────────────────────────────────
  const handleSelectAllVisible = () => {
    onSelectionChange(filteredAssets.map((a) => a.asset.id));
    handleMenuClose();
  };

  const handleSelectAll = () => {
    onSelectionChange(allAssets.map((a) => a.asset.id));
    handleMenuClose();
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
    handleMenuClose();
  };

  // ── Bulk Export ────────────────────────────────────────────────────
  const handleBulkExport = async () => {
    handleMenuClose();
    setExporting(true);
    try {
      const csvExportService = new CsvExportService();
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const filename = `assets-selected-${selectedIds.length}-${timestamp}.csv`;
      const result = await csvExportService.exportAssets(selectedAssets, filename);
      if (!result.success && result.error !== 'Export cancelled') {
        console.error('Export failed:', result.error);
      }
    } finally {
      setExporting(false);
    }
  };

  // ── Bulk Delete ────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const repoFactory = RepositoryFactory.getInstance();
      const assetService = new AssetService(repoFactory.getAssetRepository());

      // Sequential delete — keeps error handling simple and avoids
      // concurrent write contention on SQLite.
      for (const id of selectedIds) {
        await assetService.deleteAsset(id);
      }

      onSelectionChange([]); // Clear selection
      onBulkDelete();        // Trigger parent refresh
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (selectedIds.length === 0) return null;

  const filteredCount = filteredAssets.length;
  const allCount = allAssets.length;
  const showSelectAll = filteredCount !== allCount;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: 1,
        mb: 1,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
        Selected ({selectedIds.length})
      </Typography>

      <Button
        size="small"
        variant="outlined"
        color="inherit"
        onClick={handleMenuOpen}
        sx={{ borderColor: 'rgba(255,255,255,0.4)', color: 'inherit' }}
      >
        Actions
      </Button>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {/* Selection controls */}
        <MenuItem onClick={handleSelectAllVisible}>
          <ListItemIcon><DensityMediumIcon /></ListItemIcon>
          <ListItemText primary={`Select All Visible (${filteredCount})`} />
        </MenuItem>

        {showSelectAll && (
          <MenuItem onClick={handleSelectAll}>
            <ListItemIcon><SelectAllIcon /></ListItemIcon>
            <ListItemText primary={`Select All (${allCount})`} />
          </MenuItem>
        )}

        <MenuItem onClick={handleClearSelection}>
          <ListItemIcon><CloseIcon /></ListItemIcon>
          <ListItemText primary="Clear Selection" />
        </MenuItem>

        <Divider />

        {/* Bulk operations */}
        <MenuItem onClick={handleBulkExport} disabled={exporting}>
          <ListItemIcon><DownloadIcon /></ListItemIcon>
          <ListItemText primary={exporting ? 'Exporting...' : 'Export Selected'} />
        </MenuItem>

        <MenuItem
          onClick={() => { setConfirmOpen(true); handleMenuClose(); }}
        >
          <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
          <ListItemText primary="Delete Selected" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="bulk-delete-dialog-title"
      >
        <DialogTitle id="bulk-delete-dialog-title">
          Delete {selectedIds.length} {selectedIds.length === 1 ? 'Asset' : 'Assets'}?
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This action cannot be undone. All {selectedIds.length} selected{' '}
            {selectedIds.length === 1 ? 'asset' : 'assets'} will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleBulkDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
