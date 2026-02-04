import React, { useState, useEffect, useMemo } from 'react';
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
  Checkbox,
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
import { AssetBulkActions } from './AssetBulkActions';
import { ExportDialog } from './ExportDialog';
import { CsvExportService } from '@/application/services/CsvExportService';
import { useAssetFilters, useAssetSort, useDebounce, useColumnVisibility } from './hooks';

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

  // Column Visibility
  const { visibleColumns, toggleColumn, isColumnVisible, COLUMNS } = useColumnVisibility();

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // Clear selection when filters or search change
  useEffect(() => {
    setSelectedIds([]);
  }, [debouncedSearch, filters]);

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

  // ── Export Dialog ──
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const csvExportService = new CsvExportService();

  const handleExportAssets = async (exportAll: boolean) => {
    const assetsToExport = exportAll ? assets : sortedAssets;
    const timestamp = new Date().toISOString().slice(0, 10);
    const exportCols = COLUMNS.filter(c => isColumnVisible(c.key) && c.key !== 'icon').map(c => c.key);
    return csvExportService.exportAssets(assetsToExport, `assets-${timestamp}.csv`, exportCols);
  };

  const handleExportLocations = async () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    return csvExportService.exportLocations(locations, `locations-${timestamp}.csv`);
  };

  const handleExportCategories = async () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    return csvExportService.exportCategories(categories, `categories-${timestamp}.csv`);
  };

  // ── Header checkbox: select / deselect all visible (sorted+filtered) rows ──
  const handleHeaderCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedAssets.map((a) => a.asset.id));
    } else {
      setSelectedIds([]);
    }
  };

  // ── Row checkbox toggle ──
  const handleRowCheckbox = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((existingId) => existingId !== id));
    }
  };

  // Apply client-side filters (category, status, location hierarchy)
  const filteredAssets = applyFilters(assets, locations);

  // Apply sorting
  const sortedAssets = sortAssets(filteredAssets);

  // Compute full asset objects for the current selection (needed by bulk export)
  const selectedAssets = useMemo(
    () => assets.filter((a) => selectedIds.includes(a.asset.id)),
    [assets, selectedIds]
  );

  // Locations assignable to assets (Room and Floor only)
  const assignableLocations = locations.filter(
    (loc) => loc.type === 'room' || loc.type === 'floor'
  );

  // Header checkbox state
  const allVisibleSelected = sortedAssets.length > 0 && selectedIds.length === sortedAssets.length;
  const someVisibleSelected = selectedIds.length > 0 && selectedIds.length < sortedAssets.length;

  // Dynamic colSpan: checkbox col + visible data columns + actions col
  const visibleColCount = COLUMNS.filter((c) => isColumnVisible(c.key)).length;
  const totalColSpan = 1 /* checkbox */ + visibleColCount + 1; /* actions */

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
        columns={COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onOpenExport={() => setExportDialogOpen(true)}
      />

      {/* Bulk actions bar — only visible when rows are selected */}
      {selectedIds.length > 0 && (
        <AssetBulkActions
          selectedIds={selectedIds}
          selectedAssets={selectedAssets}
          filteredAssets={sortedAssets}
          allAssets={assets}
          onSelectionChange={setSelectedIds}
          onBulkDelete={loadAssets}
        />
      )}

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
                {/* Select-all checkbox */}
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someVisibleSelected}
                    checked={allVisibleSelected}
                    onChange={handleHeaderCheckbox}
                    inputProps={{ 'aria-label': 'select all' }}
                  />
                </TableCell>

                {/* Conditionally rendered header cells */}
                {isColumnVisible('icon') && <TableCell>Icon</TableCell>}
                {isColumnVisible('tag') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'tag'}
                      direction={sortState.field === 'tag' ? sortState.direction : 'asc'}
                      onClick={() => toggleSort('tag')}
                    >
                      Tag
                    </TableSortLabel>
                  </TableCell>
                )}
                {isColumnVisible('description') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'description'}
                      direction={sortState.field === 'description' ? sortState.direction : 'asc'}
                      onClick={() => toggleSort('description')}
                    >
                      Description
                    </TableSortLabel>
                  </TableCell>
                )}
                {isColumnVisible('category') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'category'}
                      direction={sortState.field === 'category' ? sortState.direction : 'asc'}
                      onClick={() => toggleSort('category')}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                )}
                {isColumnVisible('location') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'location'}
                      direction={sortState.field === 'location' ? sortState.direction : 'asc'}
                      onClick={() => toggleSort('location')}
                    >
                      Location
                    </TableSortLabel>
                  </TableCell>
                )}
                {isColumnVisible('status') && (
                  <TableCell>
                    <TableSortLabel
                      active={sortState.field === 'status'}
                      direction={sortState.field === 'status' ? sortState.direction : 'asc'}
                      onClick={() => toggleSort('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                )}
                {isColumnVisible('serialNumber') && (
                  <TableCell>Serial Number</TableCell>
                )}
                {isColumnVisible('phone') && (
                  <TableCell>Phone/Ext</TableCell>
                )}
                {isColumnVisible('owner') && (
                  <TableCell>Owner</TableCell>
                )}
                {isColumnVisible('costCentre') && (
                  <TableCell>Cost Centre</TableCell>
                )}

                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalColSpan} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No assets match your filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedAssets.map((assetWithRelations) => {
                  const { asset, category, locationPath } = assetWithRelations;
                  const IconComponent = category ? getIconComponent(category.icon) : FaBox;
                  const isSelected = selectedIds.includes(asset.id);

                  return (
                    <TableRow
                      key={asset.id}
                      hover
                      selected={isSelected}
                      onClick={() => setSelectedAsset(assetWithRelations)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {/* Row checkbox — stopPropagation prevents opening the detail drawer */}
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleRowCheckbox(asset.id, e.target.checked)}
                          inputProps={{ 'aria-label': `select ${asset.tag}` }}
                        />
                      </TableCell>

                      {/* Conditionally rendered data cells */}
                      {isColumnVisible('icon') && (
                        <TableCell>
                          <Box sx={{ color: category?.color || '#000000', fontSize: 24 }}>
                            <IconComponent />
                          </Box>
                        </TableCell>
                      )}
                      {isColumnVisible('tag') && (
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {asset.tag}
                          </Typography>
                        </TableCell>
                      )}
                      {isColumnVisible('description') && (
                        <TableCell>
                          <Typography variant="body2">{asset.description}</Typography>
                        </TableCell>
                      )}
                      {isColumnVisible('category') && (
                        <TableCell>
                          <Typography variant="body2">{category?.name || 'N/A'}</Typography>
                        </TableCell>
                      )}
                      {isColumnVisible('location') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {locationPath || 'N/A'}
                          </Typography>
                        </TableCell>
                      )}
                      {isColumnVisible('status') && (
                        <TableCell>
                          <Chip
                            label={asset.status}
                            color={STATUS_COLORS[asset.status]}
                            size="small"
                          />
                        </TableCell>
                      )}
                      {isColumnVisible('serialNumber') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {asset.serialNumber || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {isColumnVisible('phone') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {asset.phoneExtension || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {isColumnVisible('owner') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {asset.owner || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {isColumnVisible('costCentre') && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {asset.costCentre || '—'}
                          </Typography>
                        </TableCell>
                      )}

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

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        filteredAssetCount={sortedAssets.length}
        totalAssetCount={assets.length}
        onExportAssets={handleExportAssets}
        onExportLocations={handleExportLocations}
        onExportCategories={handleExportCategories}
      />
    </Box>
  );
};

export default AssetList;
