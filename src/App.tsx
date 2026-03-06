import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ProjectPicker } from '@/presentation/components/project';
import { projectService } from '@/application/services/ProjectService';
import { AppShell, CanvasPlaceholder, DetailsPanel, BottomToolbar } from '@/presentation/components/layout';
import { LocationTreeView, LocationDialog, CascadeDeleteDialog, LocationDialogData, CascadeDeleteOptions } from '@/presentation/components/location';
import { LocationService, CreateLocationDto } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { Location } from '@/domain/entities';
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

  // Load locations when database is opened
  useEffect(() => {
    if (currentDatabasePath) {
      loadLocations();
    }
  }, [currentDatabasePath]);

  const loadLocations = async () => {
    const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
    const allLocations = await locationRepo.findAll();
    setLocations(allLocations);
  };

  const handleDatabaseLoaded = (path: string) => {
    setCurrentDatabasePath(path);
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

  // Welcome screen when no project is open
  if (!currentDatabasePath) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ProjectPicker onDatabaseLoaded={handleDatabaseLoaded} />
      </ThemeProvider>
    );
  }

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
              />
            </Box>
          </Box>
        }
        centerPanel={<CanvasPlaceholder selectedLocationId={selectedLocationId} />}
        rightPanel={
          <DetailsPanel
            state={
              selectedLocation
                ? { type: 'location', data: selectedLocation }
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
    </ThemeProvider>
  );
}

export default App;
