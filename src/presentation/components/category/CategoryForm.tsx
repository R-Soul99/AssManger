import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Stack,
} from '@mui/material';
import { HexColorPicker } from 'react-colorful';
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
import { Category } from '@/domain/entities';

const ICON_OPTIONS = [
  { name: 'Box', icon: FaBox },
  { name: 'Desktop', icon: FaDesktop },
  { name: 'Printer', icon: FaPrint },
  { name: 'Phone', icon: FaPhone },
  { name: 'Chair', icon: FaChair },
  { name: 'Laptop', icon: FaLaptop },
  { name: 'Keyboard', icon: FaKeyboard },
  { name: 'Mouse', icon: FaMouse },
  { name: 'Server', icon: FaServer },
  { name: 'Network', icon: FaNetworkWired },
  { name: 'Tools', icon: FaTools },
  { name: 'Door', icon: FaDoorOpen },
  { name: 'Light', icon: FaLightbulb },
  { name: 'Fire', icon: FaFire },
  { name: 'Cooling', icon: FaSnowflake },
  { name: 'Clock', icon: FaClock },
  { name: 'Camera', icon: FaCamera },
  { name: 'TV', icon: FaTv },
  { name: 'Document', icon: FaFileAlt },
  { name: 'Settings', icon: FaCog },
];

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Category;
  mode: 'create' | 'edit';
}

const CategoryForm: React.FC<CategoryFormProps> = ({ open, onClose, onSubmit, initialData, mode }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('FaBox');
  const [color, setColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setIcon(initialData.icon);
      setColor(initialData.color);
    } else {
      setName('');
      setDescription('');
      setIcon('FaBox');
      setColor('#000000');
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description: description || null,
      icon,
      color,
      parentId: initialData?.parentId ?? null,
    });
    onClose();
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.name === iconName || `Fa${iconName}` === iconName);
    return iconOption?.icon || FaBox;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{mode === 'create' ? 'Create Category' : 'Edit Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>Icon</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {ICON_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <IconButton
                      key={option.name}
                      onClick={() => setIcon(option.name)}
                      sx={{
                        border: icon === option.name ? '2px solid' : '1px solid',
                        borderColor: icon === option.name ? 'primary.main' : 'grey.300',
                        borderRadius: 1,
                        padding: 1,
                      }}
                    >
                      <IconComponent size={20} />
                    </IconButton>
                  );
                })}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Color</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Paper
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  sx={{
                    width: 60,
                    height: 40,
                    backgroundColor: color,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                />
                <TextField
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  size="small"
                  sx={{ width: 120 }}
                />
              </Box>
              {showColorPicker && (
                <Box sx={{ mt: 2 }}>
                  <HexColorPicker color={color} onChange={setColor} />
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>Preview</Typography>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundColor: 'grey.50',
                }}
              >
                <Box sx={{ color: color, fontSize: 24 }}>
                  {React.createElement(getIconComponent(icon))}
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="bold">{name || 'Category Name'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {description || 'Description will appear here'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
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

export default CategoryForm;
