import React, { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Box } from '@mui/material';
import {
  Public as SiteIcon,
  Business as BuildingIcon,
  Layers as FloorIcon,
  MeetingRoom as RoomIcon,
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
}

const LocationTreeView: React.FC<LocationTreeViewProps> = ({
  locations,
  onSelect,
  selectedId,
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  const renderTree = (node: TreeNode) => (
    <TreeItem
      key={node.id}
      itemId={node.id}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
    <SimpleTreeView
      selectedItems={selectedId || null}
      onSelectedItemsChange={handleSelectedItemsChange}
      expandedItems={expandedItems}
      onExpandedItemsChange={handleExpandedItemsChange}
    >
      {treeData.map((node) => renderTree(node))}
    </SimpleTreeView>
  );
};

export default LocationTreeView;
