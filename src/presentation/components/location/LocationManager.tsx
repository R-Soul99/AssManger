import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { LocationService, CreateLocationDto } from '@/application/services/LocationService';
import { Location } from '@/domain/entities/Location';
import { LocationType } from '@/domain/validators/schemas';
import LocationTreeView from './LocationTreeView';
import LocationDialog from './LocationDialog';

const LocationManager: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [childType, setChildType] = useState<LocationType | undefined>();
  const [error, setError] = useState<string | null>(null);

  const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
  const locationService = new LocationService(locationRepo);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      const loc = locations.find((l) => l.id === selectedLocationId);
      setSelectedLocation(loc);
    } else {
      setSelectedLocation(undefined);
    }
  }, [selectedLocationId, locations]);

  const loadLocations = async () => {
    const allLocations = await locationRepo.findAll();
    setLocations(allLocations);
  };

  const handleAddSite = () => {
    setChildType(undefined);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleAddChild = () => {
    if (!selectedLocation) return;

    // Determine child type based on parent type
    const childTypeMap: Record<LocationType, LocationType | null> = {
      site: 'building',
      building: 'floor',
      floor: 'room',
      room: null,
    };

    const nextType = childTypeMap[selectedLocation.type];
    if (!nextType) {
      setError(`Cannot add children to ${selectedLocation.type}`);
      return;
    }

    setChildType(nextType);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedLocation) return;
    setChildType(undefined);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    if (confirm(`Are you sure you want to delete '${selectedLocation.name}'?`)) {
      const result = await locationService.deleteLocation(selectedLocation.id);
      if (result.success) {
        setSelectedLocationId(undefined);
        await loadLocations();
        setError(null);
      } else {
        setError(result.error);
      }
    }
  };

  const handleDialogSubmit = async (data: {
    name: string;
    type: LocationType;
    description?: string;
  }) => {
    if (dialogMode === 'add') {
      const dto: CreateLocationDto = {
        name: data.name,
        type: childType || data.type,
        parentId: childType ? selectedLocationId || null : null,
        description: data.description,
      };

      const result = await locationService.createLocation(dto);
      if (result.success) {
        await loadLocations();
        setError(null);
      } else {
        setError(result.error);
      }
    } else if (dialogMode === 'edit' && selectedLocation) {
      const result = await locationService.updateLocation(selectedLocation.id, {
        name: data.name,
        description: data.description,
      });
      if (result.success) {
        await loadLocations();
        setError(null);
      } else {
        setError(result.error);
      }
    }
  };

  const canAddChild = selectedLocation && selectedLocation.type !== 'room';

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          Location Hierarchy
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSite}>
          Add Site
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 2 }}>
        {locations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No locations yet. Create your first site to get started.
            </Typography>
          </Box>
        ) : (
          <Box>
            <LocationTreeView
              locations={locations}
              onSelect={setSelectedLocationId}
              selectedId={selectedLocationId}
            />

            {selectedLocation && (
              <Stack direction="row" spacing={1} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                {canAddChild && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddChild}
                  >
                    Add Child
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </Stack>
            )}
          </Box>
        )}
      </Paper>

      <LocationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        locations={locations}
        initialData={
          dialogMode === 'edit' && selectedLocation
            ? {
                id: selectedLocation.id,
                name: selectedLocation.name,
                type: selectedLocation.type,
                parentId: selectedLocation.parentId,
                description: selectedLocation.description,
              }
            : undefined
        }
        mode={dialogMode}
        parentId={selectedLocationId}
      />
    </Box>
  );
};

export default LocationManager;
