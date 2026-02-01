import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
} from '@mui/material';
import { LocationType } from '@/domain/validators/schemas';

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: LocationType;
    description?: string;
  }) => Promise<void>;
  initialData?: {
    name: string;
    type: LocationType;
    description?: string;
  };
  mode: 'create' | 'edit';
  fixedType?: LocationType; // For child creation
  disableTypeChange?: boolean;
}

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  site: 'Site',
  building: 'Building',
  floor: 'Floor',
  room: 'Room',
};

const LocationDialog: React.FC<LocationDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  fixedType,
  disableTypeChange = false,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>(fixedType || 'site');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setDescription(initialData.description || '');
    } else {
      setName('');
      setType(fixedType || 'site');
      setDescription('');
    }
  }, [initialData, fixedType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      type,
      description: description || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? `Create ${LOCATION_TYPE_LABELS[type]}` : 'Edit Location'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder={`e.g., ${type === 'site' ? 'Headquarters' : type === 'building' ? 'Main Office' : type === 'floor' ? 'Level 1' : 'Conference Room A'}`}
            />

            {!disableTypeChange && !fixedType && (
              <TextField
                select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value as LocationType)}
                fullWidth
              >
                {Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Optional notes about this location"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LocationDialog;
