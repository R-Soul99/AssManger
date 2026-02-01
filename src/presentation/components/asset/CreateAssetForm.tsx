import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Stack,
  Alert,
  FormHelperText,
} from '@mui/material';
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
import { Category, Location } from '@/domain/entities';
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

interface CreateAssetFormProps {
  open: boolean;
  onClose: () => void;
  onAssetCreated: () => void;
}

const CreateAssetForm: React.FC<CreateAssetFormProps> = ({ open, onClose, onAssetCreated }) => {
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [locationId, setLocationId] = useState<string | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categoryRepo = RepositoryFactory.getInstance().getCategoryRepository();
  const locationRepo = RepositoryFactory.getInstance().getLocationRepository();
  const assetRepo = RepositoryFactory.getInstance().getAssetRepository();
  const assetService = new AssetService(assetRepo);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    const allCategories = await categoryRepo.findAll();
    setCategories(allCategories);

    const allLocations = await locationRepo.findAll();
    setLocations(allLocations);
  };

  const resetForm = () => {
    setTag('');
    setDescription('');
    setCategoryId('');
    setLocationId('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tag || !description || !categoryId || !locationId) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);

    const result = await assetService.createAsset({
      tag,
      description,
      categoryId: categoryId as number,
      locationId: locationId as string,
      status: 'active',
    });

    setLoading(false);

    if (result.success) {
      resetForm();
      onAssetCreated();
      onClose();
    } else {
      setError(result.error);
    }
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FaBox;
  };

  // Get only Room and Floor type locations for asset assignment
  const assignableLocations = locations.filter(
    (loc) => loc.type === 'room' || loc.type === 'floor'
  );

  const buildLocationLabel = (location: Location): string => {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Asset</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              label="Asset Tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="e.g., PC-001, DESK-123"
              helperText="Unique identifier for the asset"
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
              multiline
              rows={2}
              placeholder="Brief description of the asset"
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value as number)}
                label="Category"
              >
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
              {categories.length === 0 && (
                <FormHelperText>No categories available. Create a category first.</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value as string)}
                label="Location"
              >
                {assignableLocations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {buildLocationLabel(loc)}
                  </MenuItem>
                ))}
              </Select>
              {assignableLocations.length === 0 && (
                <FormHelperText>
                  No locations available. Create a room or floor first.
                </FormHelperText>
              )}
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Asset'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateAssetForm;
