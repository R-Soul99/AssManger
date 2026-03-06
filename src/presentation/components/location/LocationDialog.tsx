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

export interface LocationDialogData {
  name: string;
  type: LocationType;
  parentId?: string | null;
  description?: string;
}

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LocationDialogData) => Promise<void>;
  initialData?: {
    id?: string;
    name: string;
    type: LocationType;
    parentId?: string | null;
    description?: string;
  };
  mode: 'add' | 'edit';
  locations: { id: string; name: string; type: LocationType; parentId?: string | null }[]; // For parent dropdown
  parentId?: string | null; // Pre-selected parent when adding child
}

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  site: 'Site',
  building: 'Building',
  floor: 'Floor',
  room: 'Room',
};

// Hierarchy rules: site > building > floor > room
const getChildType = (parentType: LocationType): LocationType => {
  switch (parentType) {
    case 'site':
      return 'building';
    case 'building':
      return 'floor';
    case 'floor':
      return 'room';
    case 'room':
      return 'room'; // Rooms can't have children, but fallback
  }
};

const getValidParentTypes = (childType: LocationType): LocationType[] => {
  switch (childType) {
    case 'site':
      return []; // Sites have no parent
    case 'building':
      return ['site'];
    case 'floor':
      return ['building'];
    case 'room':
      return ['floor'];
  }
};

const LocationDialog: React.FC<LocationDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  locations,
  parentId: initialParentId,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('site');
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setParentId(initialData.parentId || null);
      setDescription(initialData.description || '');
    } else {
      setName('');
      // Infer type from parent if provided
      if (initialParentId) {
        const parent = locations.find(loc => loc.id === initialParentId);
        if (parent) {
          const childType = getChildType(parent.type);
          setType(childType);
          setParentId(initialParentId);
        } else {
          setType('site');
          setParentId(null);
        }
      } else {
        setType('site');
        setParentId(null);
      }
      setDescription('');
    }
  }, [initialData, initialParentId, locations, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      type,
      parentId,
      description: description || undefined,
    });
    onClose();
  };

  // Filter locations to show only valid parents for the selected type
  const validParentTypes = getValidParentTypes(type);
  const validParentLocations = locations.filter(loc =>
    validParentTypes.includes(loc.type)
  );

  // Determine if parent field should be required
  const isParentRequired = type !== 'site';

  // Check if form is valid
  const isFormValid = name.trim().length > 0 && (!isParentRequired || parentId !== null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'add' ? 'Add Location' : 'Edit Location'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Type"
              value={type}
              onChange={(e) => {
                const newType = e.target.value as LocationType;
                setType(newType);
                // Reset parent when type changes
                if (newType === 'site') {
                  setParentId(null);
                } else if (validParentLocations.length > 0) {
                  setParentId(validParentLocations[0].id);
                } else {
                  setParentId(null);
                }
              }}
              fullWidth
              disabled={mode === 'edit'} // Can't change type when editing
            >
              {Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder={`e.g., ${type === 'site' ? 'Headquarters' : type === 'building' ? 'Main Office' : type === 'floor' ? 'Level 1' : 'Conference Room A'}`}
            />

            {type !== 'site' && (
              <TextField
                select
                label="Parent Location"
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                fullWidth
                required
                helperText={
                  validParentLocations.length === 0
                    ? `No ${LOCATION_TYPE_LABELS[validParentTypes[0]]} locations available. Create one first.`
                    : `Select a ${LOCATION_TYPE_LABELS[validParentTypes[0]]}`
                }
                disabled={validParentLocations.length === 0 || mode === 'edit'} // Can't change parent when editing
              >
                {validParentLocations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.name}
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
          <Button type="submit" variant="contained" disabled={!isFormValid}>
            {mode === 'add' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LocationDialog;
