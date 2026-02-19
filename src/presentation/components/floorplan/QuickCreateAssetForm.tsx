import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormHelperText,
} from '@mui/material';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { AssetService } from '@/application/services/AssetService';
import { Category, Location } from '@/domain/entities';

// description is optional — user can complete it later from the asset list (locked decision: minimal friction)
const quickCreateSchema = z.object({
  tag: z.string().min(1, 'Asset tag is required'),
  description: z.string().optional(),
  categoryId: z.number().min(1, 'Category is required'),
  locationId: z.string().nullable().optional(),
});

type QuickCreateFormData = z.infer<typeof quickCreateSchema>;

interface QuickCreateAssetFormProps {
  onAssetCreated: (assetId: string) => void;
  onCancel: () => void;
}

export const QuickCreateAssetForm: React.FC<QuickCreateAssetFormProps> = ({
  onAssetCreated,
  onCancel,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuickCreateFormData>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      tag: '',
      description: '',
      categoryId: undefined,
      locationId: null,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const categoryRepo = RepositoryFactory.getInstance().getCategoryRepository();
      const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
      const [allCategories, allLocations] = await Promise.all([
        categoryRepo.findAll(),
        locationRepo.findAll(),
      ]);
      setCategories(allCategories);
      // Filter to Room and Floor types for asset assignment (consistent with 02-04 and 03-02 patterns)
      setLocations(allLocations.filter((loc) => loc.type === 'room' || loc.type === 'floor'));
    } catch (err) {
      console.error('[QuickCreateAssetForm] Failed to load data:', err);
    }
  };

  const buildLocationLabel = (location: Location, allLocations: Location[]): string => {
    const path: string[] = [location.name];
    let current = location;
    while (current.parentId) {
      const parent = allLocations.find((loc) => loc.id === current.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }
    return path.join(' > ');
  };

  const onSubmit = async (data: QuickCreateFormData) => {
    setSubmitError(null);
    try {
      const assetRepo = RepositoryFactory.getInstance().getAssetRepository();
      const assetService = new AssetService(assetRepo);

      const result = await assetService.createAsset({
        tag: data.tag,
        description: data.description || data.tag, // fallback to tag if description omitted
        categoryId: data.categoryId,
        ...(data.locationId ? { locationId: data.locationId } : {}),
        status: 'active',
      });

      if (result.success) {
        onAssetCreated(result.data.id);
      } else {
        setSubmitError(result.error);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create asset');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Create New Asset
      </Typography>

      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <TextField
        label="Asset Tag"
        {...register('tag')}
        error={!!errors.tag}
        helperText={errors.tag?.message}
        autoFocus
        fullWidth
        size="small"
        placeholder="e.g., PC-001, DESK-123"
      />

      <TextField
        label="Description"
        {...register('description')}
        error={!!errors.description}
        helperText={errors.description?.message ?? 'Optional — can be added later'}
        fullWidth
        size="small"
      />

      <Controller
        name="categoryId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth size="small" required error={!!errors.categoryId}>
            <InputLabel>Category</InputLabel>
            <Select
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value as number)}
              label="Category"
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
            {errors.categoryId && (
              <FormHelperText>{errors.categoryId.message}</FormHelperText>
            )}
            {categories.length === 0 && !errors.categoryId && (
              <FormHelperText>No categories available. Create a category first.</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Controller
        name="locationId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth size="small">
            <InputLabel>Location</InputLabel>
            <Select
              {...field}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value || null)}
              label="Location"
            >
              <MenuItem value="">
                <em>None — assign later</em>
              </MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {buildLocationLabel(loc, locations)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Optional — can be assigned later</FormHelperText>
          </FormControl>
        )}
      />

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
        >
          Create & Link
        </Button>
      </Box>
    </Box>
  );
};
