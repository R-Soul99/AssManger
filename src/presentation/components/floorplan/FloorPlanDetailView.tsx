import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { FloorPlan } from '@/domain/entities';
import { Location } from '@/domain/entities';
import { FloorPlanService } from '@/application/services';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { useFloorPlanImage } from './hooks/useFloorPlanImage';

interface FloorPlanDetailViewProps {
  floorPlanId: string;
  onBack: () => void;
  onUpdated: () => void;
}

interface FormData {
  name: string;
  locationId: string;
}

export function FloorPlanDetailView({
  floorPlanId,
  onBack,
  onUpdated,
}: FloorPlanDetailViewProps) {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<FormData>({
    defaultValues: {
      name: '',
      locationId: '',
    },
  });

  const { imageUrl } = useFloorPlanImage(floorPlan?.imageRelativePath ?? null);

  // Load floor plan and locations
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const floorPlanService = new FloorPlanService(
          RepositoryFactory.getInstance().getFloorPlanRepository()
        );
        const locationRepo = RepositoryFactory.getInstance().getLocationRepository();

        const [fpResult, allLocations] = await Promise.all([
          floorPlanService.getFloorPlanById(floorPlanId),
          locationRepo.findAll(),
        ]);

        if (!fpResult.success) {
          throw new Error(fpResult.error);
        }

        setFloorPlan(fpResult.data);
        setLocations(allLocations);

        // Initialize form with floor plan data
        reset({
          name: fpResult.data.name,
          locationId: fpResult.data.locationId || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load floor plan');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [floorPlanId, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError(null);

    try {
      const floorPlanService = new FloorPlanService(
        RepositoryFactory.getInstance().getFloorPlanRepository()
      );

      const result = await floorPlanService.updateFloorPlan(floorPlanId, {
        name: data.name.trim(),
        locationId: data.locationId || null,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onUpdated();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Filter locations to floor and building types (floor plans attach to floors or buildings)
  const assignableLocations = locations.filter(
    (l) => l.type === 'floor' || l.type === 'building'
  );

  // Build location path for display in dropdown
  const buildLocationPath = (locationId: string): string => {
    const parts: string[] = [];
    let current = locations.find((l) => l.id === locationId);
    while (current) {
      parts.unshift(current.name);
      current = current.parentId
        ? locations.find((l) => l.id === current!.parentId)
        : undefined;
    }
    return parts.join(' > ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!floorPlan) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Floor plan not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        Back to Floor Plans
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Edit Floor Plan
        </Typography>

        {/* Image preview */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 600,
            height: 300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'grey.100',
            borderRadius: 1,
            mb: 3,
            overflow: 'hidden',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={floorPlan.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <Typography color="text.secondary">Image not available</Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {floorPlan.imageWidth} x {floorPlan.imageHeight} pixels
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Floor Plan Name"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="locationId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select {...field} label="Location">
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {assignableLocations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {buildLocationPath(location.id)} ({location.type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isDirty || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outlined" onClick={onBack}>
                Cancel
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
