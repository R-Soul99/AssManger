import { useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  Button,
  Paper,
  Skeleton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
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

interface AssetListViewProps {
  assets: AssetWithRelations[];
  loading: boolean;
  onEdit: (assetId: string) => void;
  onDelete: (assetId: string) => void;
  onCreate: () => void;
}

/**
 * AssetListView - Table display of assets with action buttons
 *
 * Displays assets in a MUI Table with:
 * - Tag, Description, Asset Type, Location, Status columns
 * - Edit and Delete action buttons
 * - Empty state with "Create Asset" button
 * - Loading state with skeleton rows
 *
 * Uses useMemo to prevent unnecessary re-renders when parent state changes.
 */
export function AssetListView({ assets, loading, onEdit, onDelete, onCreate }: AssetListViewProps) {
  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FaBox;
  };

  // Memoize the asset rows to prevent re-renders when filters change
  // but the filtered results are the same
  const assetRows = useMemo(() => {
    return assets.map((assetWithRelations) => {
      const { asset, category, location } = assetWithRelations;
      const IconComponent = category ? getIconComponent(category.icon) : FaBox;

      return (
        <TableRow key={asset.id} hover>
          <TableCell>{asset.tag}</TableCell>
          <TableCell>
            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
              {asset.description}
            </Typography>
          </TableCell>
          <TableCell>
            {category ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: category.color, fontSize: 18 }}>
                  <IconComponent />
                </Box>
                <Typography variant="body2">{category.name}</Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                N/A
              </Typography>
            )}
          </TableCell>
          <TableCell>
            {location ? (
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                {location.name}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No location
              </Typography>
            )}
          </TableCell>
          <TableCell>
            <Chip
              label={asset.status}
              size="small"
              color={STATUS_COLORS[asset.status] || 'default'}
            />
          </TableCell>
          <TableCell align="right">
            <IconButton size="small" onClick={() => onEdit(asset.id)} title="Edit asset">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(asset.id)} title="Delete asset">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      );
    });
  }, [assets, onEdit, onDelete]);

  // Loading state
  if (loading) {
    return (
      <Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rectangular" height={53} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  // Empty state
  if (assets.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No assets found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create your first asset to get started
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
          Create Asset
        </Button>
      </Box>
    );
  }

  // Table view
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tag</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Asset Type</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{assetRows}</TableBody>
      </Table>
    </TableContainer>
  );
}
