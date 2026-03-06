import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ProjectPicker } from '@/presentation/components/project';
import { projectService } from '@/application/services/ProjectService';
import { AppShell, CanvasPlaceholder, DetailsPanel, BottomToolbar } from '@/presentation/components/layout';
import { LocationTreeView, LocationDialog, CascadeDeleteDialog, LocationDialogData, CascadeDeleteOptions } from '@/presentation/components/location';
import { CreateAssetForm, AssetDetailDrawer, DeleteAssetDialog, ExportDialog } from '@/presentation/components/asset';
import { LocationService, CreateLocationDto, AssetService, CsvExportService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { Location } from '@/domain/entities';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import { CategoryData, LocationData } from '@/domain/validators';
import { useDebounce } from '@/presentation/components/asset/hooks';
import './App.css';

const theme = createTheme();

console.log('[App] Component loaded');

function App() {
  console.log('[App] Component rendering');
  const [currentDatabasePath, setCurrentDatabasePath] = useState<string | null>(null);

  // Location management state
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationDialogMode, setLocationDialogMode] = useState<'add' | 'edit'>('add');
  const [locationDialogParentId, setLocationDialogParentId] = useState<string | null>(null);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<{
    id: string;
    name: string;
    childCount: number;
    assetCount: number;
  } | null>(null);

  // Asset management state
  const [assets, setAssets] = useState<AssetWithRelations[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ categoryId?: number; locationId?: string; status?: string }>({});
  const [createAssetDialogOpen, setCreateAssetDialogOpen] = useState(false);
  const [deleteAssetDialogOpen, setDeleteAssetDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithRelations | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Auto-restore: re-enter the most recent project on mount (survives page refresh)
  // Skip auto-restore if migrations are needed (user must go through manual open flow with backup prompt)
  useEffect(() => {
    const recent = projectService.getRecentProjects();
    if (recent.length === 0) return;
    const last = recent[0];
    projectService.openExistingProject(last.path).then(result => {
      if (result.success && !result.needsMigration) {
        // Only auto-restore if no migrations needed
        setCurrentDatabasePath(result.path);
      }
      // If migrations needed, user must manually open via ProjectPicker (triggers backup prompt)
    });
  }, []);

  // Load locations and assets when database is opened
  useEffect(() => {
    if (currentDatabasePath) {
      loadLocations();
      loadAssets();
      loadCategories();
    }
  }, [currentDatabasePath]);

  const loadLocations = async () => {
    const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
    const allLocations = await locationRepo.findAll();
    setLocations(allLocations);
  };

  const loadAssets = async () => {
    setAssetsLoading(true);
    const assetRepo = RepositoryFactory.getInstance().getAssetRepository();
    const assetService = new AssetService(assetRepo);
    const result = await assetService.getAssetsWithRelations();
    if (result.success) {
      setAssets(result.data);
    }
    setAssetsLoading(false);
  };

  const loadCategories = async () => {
    const categoryRepo = RepositoryFactory.getInstance().getCategoryRepository();
    const allCategories = await categoryRepo.findAll();
    // Convert Category entities to CategoryData
    const categoryData: CategoryData[] = allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      parentId: cat.parentId,
      description: cat.description ?? undefined,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
    setCategories(categoryData);
  };

  const handleDatabaseLoaded = (path: string) => {
    setCurrentDatabasePath(path);
  };

  // Asset CRUD handlers
  const handleCreateAsset = () => {
    setCreateAssetDialogOpen(true);
  };

  const handleAssetCreated = async () => {
    await loadAssets();
    setCreateAssetDialogOpen(false);
  };

  const handleEditAsset = (id: string) => {
    const asset = assets.find(a => a.asset.id === id);
    if (asset) {
      setSelectedAsset(asset);
    }
  };

  const handleAssetSaved = async () => {
    await loadAssets();
    setSelectedAsset(null);
  };

  const handleDeleteAsset = (id: string) => {
    const asset = assets.find(a => a.asset.id === id);
    if (asset) {
      setSelectedAsset(asset);
      setDeleteAssetDialogOpen(true);
    }
  };

  const handleConfirmDeleteAsset = async (assetId: string) => {
    const assetRepo = RepositoryFactory.getInstance().getAssetRepository();
    const assetService = new AssetService(assetRepo);
    const result = await assetService.deleteAsset(assetId);
    if (result.success) {
      await loadAssets();
      setDeleteAssetDialogOpen(false);
      setSelectedAsset(null);
    } else {
      alert(`Failed to delete asset: ${result.error}`);
    }
  };

  // Location CRUD handlers
  const handleAddLocation = (parentId?: string) => {
    setLocationDialogMode('add');
    setLocationDialogParentId(parentId || null);
    setLocationToEdit(null);
    setLocationDialogOpen(true);
  };

  const handleEditLocation = (id: string) => {
    const location = locations.find(loc => loc.id === id);
    if (location) {
      setLocationDialogMode('edit');
      setLocationToEdit(location);
      setLocationDialogParentId(null);
      setLocationDialogOpen(true);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
    const location = locations.find(loc => loc.id === id);
    if (!location) return;

    // Get child count and asset count
    const hasChildren = await locationRepo.hasChildren(id);
    const hasAssets = await locationRepo.hasAssets(id);
    const childCount = hasChildren ? locations.filter(loc => loc.parentId === id).length : 0;

    // TODO: Get actual asset count from asset repository
    const assetCount = hasAssets ? 0 : 0; // Placeholder for now

    setLocationToDelete({
      id: location.id,
      name: location.name,
      childCount,
      assetCount,
    });
    setDeleteDialogOpen(true);
  };

  const handleSaveLocation = async (data: LocationDialogData) => {
    const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
    const locationService = new LocationService(locationRepo);

    try {
      if (locationDialogMode === 'add') {
        // Create new location
        const dto: CreateLocationDto = {
          name: data.name,
          type: data.type,
          parentId: data.parentId || null,
          description: data.description,
        };
        const result = await locationService.createLocation(dto);
        if (!result.success) {
          console.error('Failed to create location:', result.error);
          alert(`Failed to create location: ${result.error}`);
          return;
        }
      } else {
        // Edit existing location
        if (locationToEdit) {
          const result = await locationService.updateLocation(locationToEdit.id, {
            name: data.name,
            description: data.description,
          });
          if (!result.success) {
            console.error('Failed to update location:', result.error);
            alert(`Failed to update location: ${result.error}`);
            return;
          }
        }
      }

      // Reload locations
      await loadLocations();
      setLocationDialogOpen(false);
    } catch (error) {
      console.error('Error saving location:', error);
      alert(`Error saving location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleConfirmDelete = async (options: CascadeDeleteOptions) => {
    if (!locationToDelete) return;

    const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
    const locationService = new LocationService(locationRepo);

    try {
      // For now, LocationService.deleteLocation doesn't support cascade
      // We'll implement cascade logic later when needed
      console.log('Delete with cascade:', options.cascade);
      const result = await locationService.deleteLocation(locationToDelete.id);
      if (!result.success) {
        console.error('Failed to delete location:', result.error);
        alert(`Failed to delete location: ${result.error}`);
        return;
      }

      // Reload locations
      await loadLocations();

      // Clear selection if deleted location was selected
      if (selectedLocationId === locationToDelete.id) {
        setSelectedLocationId(null);
      }

      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      console.error('Error deleting location:', error);
      alert(`Error deleting location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export handlers
  const handleOpenExport = () => {
    setExportDialogOpen(true);
  };

  const handleExportAssets = async (exportAll: boolean) => {
    try {
      const csvExportService = new CsvExportService();
      const assetsToExport = exportAll ? assets : filteredAssets;

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `assets_export_${date}.csv`;

      const result = await csvExportService.exportAssets(assetsToExport, filename);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const handleExportLocations = async () => {
    try {
      const csvExportService = new CsvExportService();

      // Convert Location[] to LocationData[]
      const locationData: LocationData[] = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        type: loc.type,
        parentId: loc.parentId,
        description: loc.description,
        createdAt: loc.createdAt,
        updatedAt: loc.updatedAt,
      }));

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `locations_export_${date}.csv`;

      const result = await csvExportService.exportLocations(locationData, filename);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const handleExportCategories = async () => {
    try {
      const csvExportService = new CsvExportService();

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `categories_export_${date}.csv`;

      const result = await csvExportService.exportCategories(categories, filename);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Welcome screen when no project is open
  if (!currentDatabasePath) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ProjectPicker onDatabaseLoaded={handleDatabaseLoaded} />
      </ThemeProvider>
    );
  }

  // Filter assets by location, search term, and filters
  const filteredAssets = useMemo(() => {
    let result = assets;

    // Filter by selected location
    if (selectedLocationId) {
      result = result.filter(a => a.asset.locationId === selectedLocationId);
    }

    // Filter by search term (debounced)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(a =>
        a.asset.tag.toLowerCase().includes(searchLower) ||
        a.asset.description.toLowerCase().includes(searchLower) ||
        a.category?.name.toLowerCase().includes(searchLower) ||
        a.location?.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (filters.categoryId !== undefined) {
      result = result.filter(a => a.asset.categoryId === filters.categoryId);
    }

    // Filter by status
    if (filters.status) {
      result = result.filter(a => a.asset.status === filters.status);
    }

    // Filter by location (from filter panel, not tree selection)
    if (filters.locationId) {
      result = result.filter(a => a.asset.locationId === filters.locationId);
    }

    return result;
  }, [assets, selectedLocationId, debouncedSearchTerm, filters]);

  // Convert locations to LocationData format for filters
  const locationData: LocationData[] = useMemo(() => {
    return locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      parentId: loc.parentId,
      description: loc.description,
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
    }));
  }, [locations]);

  // Main application view when project is open
  const selectedLocation = selectedLocationId
    ? locations.find(loc => loc.id === selectedLocationId)
    : undefined;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell
        leftPanel={
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Locations
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAddLocation()}
                fullWidth
                variant="outlined"
              >
                Add Location
              </Button>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              <LocationTreeView
                locations={locations}
                selectedId={selectedLocationId || undefined}
                onSelect={setSelectedLocationId}
                onAddChild={handleAddLocation}
                onRename={handleEditLocation}
                onMove={(id) => console.log('Move not implemented yet:', id)}
                onDelete={handleDeleteLocation}
                onExport={handleOpenExport}
              />
            </Box>
          </Box>
        }
        centerPanel={<CanvasPlaceholder selectedLocationId={selectedLocationId} />}
        rightPanel={
          <DetailsPanel
            state={
              selectedLocation
                ? {
                    type: 'location',
                    data: selectedLocation,
                    assets: filteredAssets,
                    assetTypes: categories,
                    locations: locationData,
                    searchTerm: searchTerm,
                    filters: filters,
                    onSearch: setSearchTerm,
                    onFilterChange: setFilters,
                    onCreateAsset: handleCreateAsset,
                    onEditAsset: handleEditAsset,
                    onDeleteAsset: handleDeleteAsset,
                    loading: assetsLoading,
                  }
                : { type: 'empty' }
            }
          />
        }
        toolbar={<BottomToolbar />}
      />

      <LocationDialog
        open={locationDialogOpen}
        mode={locationDialogMode}
        locations={locations}
        parentId={locationDialogParentId}
        initialData={
          locationToEdit
            ? {
                id: locationToEdit.id,
                name: locationToEdit.name,
                type: locationToEdit.type,
                parentId: locationToEdit.parentId,
                description: locationToEdit.description,
              }
            : undefined
        }
        onClose={() => setLocationDialogOpen(false)}
        onSubmit={handleSaveLocation}
      />

      <CascadeDeleteDialog
        open={deleteDialogOpen}
        location={locationToDelete}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <CreateAssetForm
        open={createAssetDialogOpen}
        onClose={() => setCreateAssetDialogOpen(false)}
        onAssetCreated={handleAssetCreated}
      />

      <AssetDetailDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onSave={handleAssetSaved}
        categories={categories}
        locations={locationData}
      />

      <DeleteAssetDialog
        open={deleteAssetDialogOpen}
        asset={selectedAsset ? {
          id: selectedAsset.asset.id,
          tag: selectedAsset.asset.tag,
          description: selectedAsset.asset.description,
        } : null}
        onClose={() => {
          setDeleteAssetDialogOpen(false);
          setSelectedAsset(null);
        }}
        onConfirm={handleConfirmDeleteAsset}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        filteredAssetCount={filteredAssets.length}
        totalAssetCount={assets.length}
        onExportAssets={handleExportAssets}
        onExportLocations={handleExportLocations}
        onExportCategories={handleExportCategories}
      />
    </ThemeProvider>
  );
}

export default App;
