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
  TableSortLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
import { CategoryData, LocationData } from '@/domain/validators';
import CreateAssetForm from './CreateAssetForm';
import AssetDetailDrawer from './AssetDetailDrawer';
import { AssetListToolbar } from './AssetListToolbar';
import { useAssetFilters, useAssetSort, useDebounce } from './hooks';

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
  // Data State
  const [assets, setAssets] = useState<AssetWithRelations[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  
  // UI State
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Filter & Sort Hooks
  const { filters, updateFilter, clearFilters, applyFilters } = useAssetFilters();
  const { sortState, toggleSort, sortAssets } = useAssetSort();

  // Services
  const repoFactory = RepositoryFactory.getInstance();
  const assetRepo = repoFactory.getAssetRepository();
  const categoryRepo = repoFactory.getCategoryRepository();
  const locationRepo = repoFactory.getLocationRepository();
  const assetService = new AssetService(assetRepo);

  // Initial Data Load
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Reload assets when search term changes (server-side filter)
  useEffect(() => {
    loadAssets();
  }, [debouncedSearch]);

  const loadReferenceData = async () => {
    try {
      const [cats, locs] = await Promise.all([
        categoryRepo.findAll(),
        locationRepo.findAll(),
      ]);
      setCategories(cats);
      setLocations(locs);
    } catch (err) {
      console.error('Failed to load reference data', err);
      setError('Failed to load categories and locations');
    }
  };

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    // Pass search term to repository for efficient text search
    const result = await assetService.getAssetsWithRelations({
      searchTerm: debouncedSearch || undefined,
    });
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

  const handleClearFilters = () => {
    setSearchInput('');
    clearFilters();
  };

  // Apply client-side filters (category, status, location hierarchy)
  const filteredAssets = applyFilters(assets, locations);

  // Apply sorting
  const sortedAssets = sortAssets(filteredAssets);

  // Locations assignable to assets (Room and Floor only)
  const assignableLocations = locations.filter(
    (loc) => loc.type === 'room' || loc.type === 'floor'
  );

  if (loading && assets.length === 0) {
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

      <AssetListToolbar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={handleClearFilters}
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        categories={categories}
        locations={locations}
        assetCount={assets.length}
        filteredCount={filteredAssets.length}
      />

      <TableContainer component={Paper} elevation={2}>
        {assets.length === 0 && !loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No assets found. Create your first asset to get started.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Icon</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortState.field === 'tag'}
                    direction={sortState.field === 'tag' ? sortState.direction : 'asc'}
                    onClick={() => toggleSort('tag')}
                  >
                    Tag
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortState.field === 'description'}
                    direction={sortState.field === 'description' ? sortState.direction : 'asc'}
                    onClick={() => toggleSort('description')}
                  >
                    Description
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortState.field === 'category'}
                    direction={sortState.field === 'category' ? sortState.direction : 'asc'}
                    onClick={() => toggleSort('category')}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortState.field === 'location'}
                    direction={sortState.field === 'location' ? sortState.direction : 'asc'}
                    onClick={() => toggleSort('location')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortState.field === 'status'}
                    direction={sortState.field === 'status' ? sortState.direction : 'asc'}
                    onClick={() => toggleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No assets match your filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedAssets.map((assetWithRelations) => {
                  const { asset, category, locationPath } = assetWithRelations;
                  const IconComponent = category ? getIconComponent(category.icon) : FaBox;
                  return (
                    <TableRow
                      key={asset.id}
                      hover
                      onClick={() => setSelectedAsset(assetWithRelations)}
                      sx={{ cursor: 'pointer' }}
                    >
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
                        <IconButton
                          size="small"
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(asset.id, asset.tag);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <CreateAssetForm open={formOpen} onClose={handleCloseForm} onAssetCreated={handleAssetCreated} />

      <AssetDetailDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onSave={() => {
          loadAssets();
        }}
        categories={categories}
        locations={assignableLocations}
      />
    </Box>
  );
};

export default AssetList;