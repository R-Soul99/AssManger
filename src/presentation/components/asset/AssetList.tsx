import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  FaBox,
  FaDesktop,
  FaPrint,
  FaPhone,
  FaChair,
  FaLaptop,
  FaKeyboard,
  FaMouse,
  FaServer,
  FaNetworkWired,
  FaTools,
  FaDoorOpen,
  FaLightbulb,
  FaFire,
  FaSnowflake,
  FaClock,
  FaCamera,
  FaTv,
  FaFileAlt,
  FaCog,
} from 'react-icons/fa';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { AssetService } from '@/application/services/AssetService';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import CreateAssetForm from './CreateAssetForm';

const ICON_MAP: Record<string, any> = {
  Box: FaBox,
  Desktop: FaDesktop,
  Printer: FaPrint,
  Phone: FaPhone,
  Chair: FaChair,
  Laptop: FaLaptop,
  Keyboard: FaKeyboard,
  Mouse: FaMouse,
  Server: FaServer,
  Network: FaNetworkWired,
  Tools: FaTools,
  Door: FaDoorOpen,
  Light: FaLightbulb,
  Fire: FaFire,
  Cooling: FaSnowflake,
  Clock: FaClock,
  Camera: FaCamera,
  TV: FaTv,
  Document: FaFileAlt,
  Settings: FaCog,
};

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  active: 'success',
  pending: 'warning',
  decommissioned: 'default',
  faulty: 'error',
  maintenance: 'info',
};

const AssetList: React.FC = () => {
  const [assets, setAssets] = useState<AssetWithRelations[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const assetRepo = RepositoryFactory.getInstance().getAssetRepository();
  const assetService = new AssetService(assetRepo);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    const result = await assetService.getAssetsWithRelations();
    setLoading(false);

    if (result.success) {
      setAssets(result.data);
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (id: string, tag: string) => {
    if (confirm(`Are you sure you want to delete asset '${tag}'?`)) {
      const result = await assetService.deleteAsset(id);
      if (result.success) {
        await loadAssets();
      } else {
        setError(result.error);
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FaBox;
  };

  const handleOpenCreate = () => {
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
  };

  const handleAssetCreated = () => {
    loadAssets();
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading assets...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          Asset Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Asset
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={2}>
        {assets.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No assets yet. Create your first asset to get started.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Icon</TableCell>
                <TableCell>Tag</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map(({ asset, category, locationPath }) => {
                const IconComponent = category ? getIconComponent(category.icon) : FaBox;
                return (
                  <TableRow key={asset.id} hover>
                    <TableCell>
                      <Box sx={{ color: category?.color || '#000000', fontSize: 24 }}>
                        <IconComponent />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {asset.tag}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{asset.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{category?.name || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {locationPath || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status}
                        color={STATUS_COLORS[asset.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" aria-label="edit" sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="delete"
                        onClick={() => handleDelete(asset.id, asset.tag)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <CreateAssetForm open={formOpen} onClose={handleCloseForm} onAssetCreated={handleAssetCreated} />
    </Box>
  );
};

export default AssetList;
