import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
import { Category } from '@/domain/entities';
import CategoryForm from './CategoryForm';

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

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const categoryRepo = RepositoryFactory.getInstance().getCategoryRepository();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const allCategories = await categoryRepo.findAll();
    setCategories(allCategories);
  };

  const handleCreate = async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    await categoryRepo.create(data);
    await loadCategories();
  };

  const handleUpdate = async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingCategory) {
      await categoryRepo.update(editingCategory.id, data);
      await loadCategories();
      setEditingCategory(undefined);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      await categoryRepo.delete(id);
      await loadCategories();
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCategory(undefined);
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FaBox;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          Category Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Add Category
        </Button>
      </Box>

      <Paper elevation={2}>
        {categories.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No categories yet. Create your first category to get started.
            </Typography>
          </Box>
        ) : (
          <List>
            {categories.map((cat, index) => {
              const IconComponent = getIconComponent(cat.icon);
              return (
                <React.Fragment key={cat.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      <Box sx={{ color: cat.color, fontSize: 28 }}>
                        <IconComponent />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={cat.name}
                      secondary={cat.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpenEdit(cat)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      <CategoryForm
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={editingCategory ? handleUpdate : handleCreate}
        initialData={editingCategory}
        mode={editingCategory ? 'edit' : 'create'}
      />
    </Box>
  );
};

export default CategoryManager;
