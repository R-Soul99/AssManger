import React, { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Box, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Public as SiteIcon,
  Business as BuildingIcon,
  Layers as FloorIcon,
  MeetingRoom as RoomIcon,
  Add as AddIcon,
  Edit as EditIcon,
  DriveFileMove as MoveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Location } from '@/domain/entities/Location';
import { LocationType } from '@/domain/validators/schemas';

interface TreeNode {
  id: string;
  name: string;
  type: LocationType;
  children: TreeNode[];
}

interface LocationTreeViewProps {
  locations: Location[];
  onSelect?: (locationId: string) => void;
  selectedId?: string;
  onAddChild?: (parentId: string) => void;
  onRename?: (id: string) => void;
  onMove?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const LocationTreeView: React.FC<LocationTreeViewProps> = ({
  locations,
  onSelect,
  selectedId,
  onAddChild,
  onRename,
  onMove,
  onDelete,
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    locationId: string;
  } | null>(null);

  // Convert flat location list to tree structure
  const buildTree = (locations: Location[]): TreeNode[] => {
    const locationMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create all nodes
    locations.forEach((loc) => {
      locationMap.set(loc.id, {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        children: [],
      });
    });

    // Second pass: build hierarchy
    locations.forEach((loc) => {
      const node = locationMap.get(loc.id)!;
      if (loc.parentId && locationMap.has(loc.parentId)) {
        const parent = locationMap.get(loc.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const getIcon = (type: LocationType) => {
    switch (type) {
      case 'site':
        return <SiteIcon />;
      case 'building':
        return <BuildingIcon />;
      case 'floor':
        return <FloorIcon />;
      case 'room':
        return <RoomIcon />;
    }
  };

  const handleContextMenu = (event: React.MouseEvent, locationId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            locationId,
          }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleMenuAction = (action: 'addChild' | 'rename' | 'move' | 'delete') => {
    if (!contextMenu) return;

    const locationId = contextMenu.locationId;
    handleCloseContextMenu();

    switch (action) {
      case 'addChild':
        onAddChild?.(locationId);
        break;
      case 'rename':
        onRename?.(locationId);
        break;
      case 'move':
        onMove?.(locationId);
        break;
      case 'delete':
        onDelete?.(locationId);
        break;
    }
  };

  const renderTree = (node: TreeNode) => (
    <TreeItem
      key={node.id}
      itemId={node.id}
      label={
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          onContextMenu={(e) => handleContextMenu(e, node.id)}
        >
          {getIcon(node.type)}
          <span>{node.name}</span>
        </Box>
      }
    >
      {node.children.map((child) => renderTree(child))}
    </TreeItem>
  );

  const treeData = buildTree(locations);

  const handleSelectedItemsChange = (
    _event: React.SyntheticEvent | null,
    itemId: string | null
  ) => {
    if (itemId && onSelect) {
      onSelect(itemId);
    }
  };

  const handleExpandedItemsChange = (
    _event: React.SyntheticEvent | null,
    itemIds: string[]
  ) => {
    setExpandedItems(itemIds);
  };

  if (locations.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        No locations yet. Add a site to get started.
      </Box>
    );
  }

  return (
    <>
      <SimpleTreeView
        selectedItems={selectedId || null}
        onSelectedItemsChange={handleSelectedItemsChange}
        expandedItems={expandedItems}
        onExpandedItemsChange={handleExpandedItemsChange}
      >
        {treeData.map((node) => renderTree(node))}
      </SimpleTreeView>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => handleMenuAction('addChild')}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Child Location</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('rename')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('move')}>
          <ListItemIcon>
            <MoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move to...</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default LocationTreeView;
