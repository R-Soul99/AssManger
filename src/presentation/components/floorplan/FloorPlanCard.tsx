import { forwardRef } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Skeleton,
} from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FloorPlan } from '@/domain/entities';
import { useFloorPlanImage } from './hooks/useFloorPlanImage';

interface FloorPlanCardProps {
  plan: FloorPlan;
  locationPath: string;
  markerCount: number;
  onClick: () => void;
  isDragging?: boolean;
}

// Base card component (used for both sortable and non-sortable contexts)
export const FloorPlanCardContent = forwardRef<HTMLDivElement, FloorPlanCardProps & {
  style?: React.CSSProperties;
  dragHandleProps?: Record<string, unknown>;
}>(({ plan, locationPath, markerCount, onClick, isDragging, style, dragHandleProps, ...props }, ref) => {
  const { imageUrl, loading } = useFloorPlanImage(plan.imageRelativePath);

  return (
    <Card
      ref={ref}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        width: 280,
        opacity: isDragging ? 0.5 : 1,
        '&:hover': { boxShadow: 4 },
      }}
      style={style}
      {...props}
      {...dragHandleProps}
    >
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
