import { forwardRef } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Skeleton,
  Checkbox,
  Button,
  CardActions,
} from '@mui/material';
import { Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FloorPlan } from '@/domain/entities';
import { useFloorPlanImage } from './hooks/useFloorPlanImage';

interface FloorPlanCardProps {
  plan: FloorPlan;
  locationPath: string;
  markerCount: number;
  onClick: () => void;
  onView?: (planId: string) => void;
  isDragging?: boolean;
  selected?: boolean;
  onSelectionToggle?: (planId: string) => void;
}

// Base card component (used for both sortable and non-sortable contexts)
export const FloorPlanCardContent = forwardRef<HTMLDivElement, FloorPlanCardProps & {
  style?: React.CSSProperties;
  dragHandleProps?: Record<string, unknown>;
}>(({ plan, locationPath, markerCount, onClick, onView, isDragging, selected, onSelectionToggle, style, dragHandleProps, ...props }, ref) => {
  const { imageUrl, loading } = useFloorPlanImage(plan.imageRelativePath);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionToggle?.(plan.id);
  };

  const handleCardClick = () => {
    if (onSelectionToggle) {
      onSelectionToggle(plan.id);
    } else {
      onClick();
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(plan.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <Card
      ref={ref}
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        width: 280,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        border: selected ? 2 : 1,
        borderColor: selected ? 'primary.main' : 'divider',
        '&:hover': { boxShadow: 4 },
      }}
      style={style}
      {...props}
      {...dragHandleProps}
    >
      {onSelectionToggle && (
        <Checkbox
          checked={selected || false}
          onChange={() => {}}
          onClick={handleCheckboxClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            backgroundColor: 'background.paper',
            '&:hover': { backgroundColor: 'background.paper' },
          }}
        />
      )}
      {loading ? (
        <Skeleton variant="rectangular" height={160} />
      ) : (
        <CardMedia
          component="img"
          height={160}
          image={imageUrl || '/placeholder-floor-plan.png'}
          alt={plan.name}
          sx={{ objectFit: 'contain', backgroundColor: 'grey.100' }}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"%3E%3Crect fill="%23f5f5f5" width="200" height="160"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
      )}
      <CardContent>
        <Typography variant="body2" color="text.secondary" noWrap>
          {locationPath || 'Unassigned'}
        </Typography>
        <Typography variant="h6" component="h3" sx={{ mt: 0.5 }} noWrap>
          {plan.name}
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          {markerCount > 0 && (
            <Chip
              label={`${markerCount} marker${markerCount !== 1 ? 's' : ''}`}
              size="small"
              color="primary"
            />
          )}
        </Box>
      </CardContent>
      {!onSelectionToggle && onView && (
        <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={handleViewClick}
            variant="contained"
            fullWidth
          >
            View
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={handleEditClick}
            variant="outlined"
            fullWidth
          >
            Edit
          </Button>
        </CardActions>
      )}
    </Card>
  );
});

FloorPlanCardContent.displayName = 'FloorPlanCardContent';

// Sortable wrapper for use within DndContext
export function SortableFloorPlanCard(props: FloorPlanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.plan.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <FloorPlanCardContent
      ref={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
      {...props}
    />
  );
}

// Non-sortable card (for unassigned plans which don't have a location group)
export function FloorPlanCard(props: FloorPlanCardProps) {
  return <FloorPlanCardContent {...props} />;
}
