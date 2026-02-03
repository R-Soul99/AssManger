import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  FormHelperText,
} from '@mui/material';
import { Close as CloseIcon, Map as MapIcon } from '@mui/icons-material';
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
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import { CategoryData, LocationData } from '@/domain/validators';
import { RepositoryFactory } from '@/infrastructure/repositories/RepositoryFactory';
import { AssetService } from '@/application/services/AssetService';

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

// Form schema: text fields use empty string (not undefined) since TextFields always have a value.
// Conversion to optional DTO fields happens in the submit handler.
const UpdateAssetSchema = z.object({
  tag: z.string().min(1, "Asset tag is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.number(),
  locationId: z.string().uuid("Location is required"),
  serialNumber: z.string(),
  phoneExtension: z.string(),
  status: z.enum(['active', 'pending', 'decommissioned', 'faulty', 'maintenance']),
  owner: z.string(),
  costCentre: z.string(),
  notes: z.string(),
  cost: z.union([z.number().positive(), z.literal('')]),
  purchaseDate: z.string(), // date input uses string format; empty string = no date
});

type UpdateAssetFormData = z.infer<typeof UpdateAssetSchema>;

interface AssetDetailDrawerProps {
  asset: AssetWithRelations | null;
  onClose: () => void;
  onSave: () => void;
  categories: CategoryData[];
  locations: LocationData[];
}

const AssetDetailDrawer: React.FC<AssetDetailDrawerProps> = ({
  asset,
  onClose,
  onSave,
  categories,
  locations,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const assetRepo = RepositoryFactory.getInstance().getAssetRepository();
  const assetService = new AssetService(assetRepo);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateAssetFormData>({
    resolver: zodResolver(UpdateAssetSchema),
    defaultValues: mapAssetToFormValues(asset),
  });

  // Reset form when asset changes
  useEffect(() => {
    if (asset) {
      reset(mapAssetToFormValues(asset));
      setError(null);
    }
  }, [asset?.asset.id, reset]);

  const onSubmit = async (data: UpdateAssetFormData) => {
    if (!asset) return;

    setSaving(true);
    setError(null);

    // Convert form data to DTO
    const updateDto = {
      tag: data.tag,
      description: data.description,
      categoryId: data.categoryId,
      locationId: data.locationId,
      serialNumber: data.serialNumber || undefined,
      phoneExtension: data.phoneExtension || undefined,
      status: data.status,
      owner: data.owner || undefined,
      costCentre: data.costCentre || undefined,
      notes: data.notes || undefined,
      cost: data.cost === '' ? undefined : data.cost,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    };

    const result = await assetService.updateAsset(asset.asset.id, updateDto);
    setSaving(false);

    if (result.success) {
      reset(data); // Reset dirty state with new values
      onSave(); // Trigger list refresh
      onClose(); // Close drawer
    } else {
      setError(result.error);
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    reset(mapAssetToFormValues(asset));
    setShowConfirmDialog(false);
    onClose();
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FaBox;
  };

  const buildLocationLabel = (locationId: string): string => {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return 'N/A';

    const path: string[] = [location.name];
    let current = location;

    while (current.parentId) {
      const parent = locations.find((loc) => loc.id === current.parentId);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }

    return path.join(' > ');
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  if (!asset) return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={!!asset}
        onClose={handleCloseAttempt}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 480 },
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" component="h2">
              {asset.asset.tag}
            </Typography>
            <IconButton onClick={handleCloseAttempt} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form Content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            <form id="asset-edit-form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2.5}>
                {error && (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {/* Tag */}
                <Controller
                  name="tag"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Asset Tag"
                      required
                      fullWidth
                      error={!!errors.tag}
                      helperText={errors.tag?.message}
                    />
                  )}
                />

                {/* Description */}
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      required
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />

                {/* Category */}
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.categoryId}>
                      <InputLabel>Category</InputLabel>
                      <Select {...field} label="Category">
                        {categories.map((cat) => {
                          const IconComponent = getIconComponent(cat.icon);
                          return (
                            <MenuItem key={cat.id} value={cat.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: cat.color, fontSize: 20 }}>
                                  <IconComponent />
                                </Box>
                                <span>{cat.name}</span>
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                      {errors.categoryId && (
                        <FormHelperText>{errors.categoryId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                {/* Location */}
                <Controller
                  name="locationId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.locationId}>
                      <InputLabel>Location</InputLabel>
                      <Select {...field} label="Location">
                        {locations.map((loc) => (
                          <MenuItem key={loc.id} value={loc.id}>
                            {buildLocationLabel(loc.id)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.locationId && (
                        <FormHelperText>{errors.locationId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                {/* Serial Number */}
                <Controller
                  name="serialNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Serial Number"
                      fullWidth
                      error={!!errors.serialNumber}
                      helperText={errors.serialNumber?.message}
                    />
                  )}
                />

                {/* Phone Extension */}
                <Controller
                  name="phoneExtension"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone/Extension"
                      fullWidth
                      error={!!errors.phoneExtension}
                      helperText={errors.phoneExtension?.message}
                    />
                  )}
                />

                {/* Status */}
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.status}>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status">
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="decommissioned">Decommissioned</MenuItem>
                        <MenuItem value="faulty">Faulty</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </Select>
                      {errors.status && (
                        <FormHelperText>{errors.status.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                {/* Owner */}
                <Controller
                  name="owner"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Owner"
                      fullWidth
                      error={!!errors.owner}
                      helperText={errors.owner?.message}
                    />
                  )}
                />

                {/* Cost Centre */}
                <Controller
                  name="costCentre"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cost Centre"
                      fullWidth
                      error={!!errors.costCentre}
                      helperText={errors.costCentre?.message}
                    />
                  )}
                />

                {/* Cost */}
                <Controller
                  name="cost"
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <TextField
                      {...field}
                      value={value}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange(val === '' ? '' : parseFloat(val));
                      }}
                      label="Cost"
                      type="number"
                      fullWidth
                      error={!!errors.cost}
                      helperText={errors.cost?.message}
                      inputProps={{ step: '0.01', min: '0' }}
                    />
                  )}
                />

                {/* Purchase Date */}
                <Controller
                  name="purchaseDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Purchase Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.purchaseDate}
                      helperText={errors.purchaseDate?.message}
                    />
                  )}
                />

                {/* Notes */}
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.notes}
                      helperText={errors.notes?.message}
                    />
                  )}
                />

                {/* Metadata Section */}
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Metadata
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {formatDate(asset.asset.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Updated:</strong> {formatDate(asset.asset.updatedAt)}
                  </Typography>
                </Box>

                {/* Floor Plan Markers Section */}
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                  >
                    <MapIcon fontSize="small" />
                    Floor Plan Markers
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No floor plan markers for this asset.
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Floor plan markers will be available after floor plans are uploaded.
                  </Typography>
                </Box>
              </Stack>
            </form>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
            }}
          >
            <Button onClick={handleCloseAttempt} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="asset-edit-form"
              variant="contained"
              disabled={!isDirty || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes. Discard them?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleDiscardChanges} color="error" variant="contained">
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Helper function to map asset to form values
function mapAssetToFormValues(
  assetWithRelations: AssetWithRelations | null
): UpdateAssetFormData {
  if (!assetWithRelations) {
    return {
      tag: '',
      description: '',
      categoryId: 0,
      locationId: '',
      serialNumber: '',
      phoneExtension: '',
      status: 'active',
      owner: '',
      costCentre: '',
      notes: '',
      cost: '',
      purchaseDate: '',
    };
  }

  const asset = assetWithRelations.asset;

  return {
    tag: asset.tag,
    description: asset.description,
    categoryId: asset.categoryId,
    locationId: asset.locationId,
    serialNumber: asset.serialNumber || '',
    phoneExtension: asset.phoneExtension || '',
    status: asset.status,
    owner: asset.owner || '',
    costCentre: asset.costCentre || '',
    notes: asset.notes || '',
    cost: asset.cost ?? '',
    purchaseDate: asset.purchaseDate
      ? new Date(asset.purchaseDate).toISOString().split('T')[0]
      : '',
  };
}

export default AssetDetailDrawer;
