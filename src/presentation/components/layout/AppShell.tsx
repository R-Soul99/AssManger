import { ReactNode } from 'react';
import { Box } from '@mui/material';

interface AppShellProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  toolbar: ReactNode;
}

/**
 * AppShell - Three-panel layout with bottom toolbar
 *
 * Pattern 0 (MUI Box Layout with CSS Grid) from 02-RESEARCH.md
 *
 * Layout structure:
 * - Left panel: 280px (location tree)
 * - Center panel: 1fr (canvas/floor plan)
 * - Right panel: 320px (details panel)
 * - Bottom toolbar: 80px (tools, asset palette, furniture palette)
 *
 * Design decisions:
 * - Fixed widths (not resizable) per research recommendation
 * - No body scroll (100vh height with overflow: hidden)
 * - Individual panel scrolling where needed
 * - CSS Grid for robust layout structure
 */
export function AppShell({ leftPanel, centerPanel, rightPanel, toolbar }: AppShellProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 320px',
        gridTemplateRows: '1fr 80px',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Left panel: Location tree */}
      <Box
        sx={{
          gridColumn: 1,
          gridRow: 1,
          overflow: 'auto',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {leftPanel}
      </Box>

      {/* Center panel: Canvas/floor plan */}
      <Box
        sx={{
          gridColumn: 2,
          gridRow: 1,
          overflow: 'hidden',
          bgcolor: 'grey.50',
        }}
      >
        {centerPanel}
      </Box>

      {/* Right panel: Details */}
      <Box
        sx={{
          gridColumn: 3,
          gridRow: 1,
          overflow: 'auto',
          borderLeft: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {rightPanel}
      </Box>

      {/* Bottom toolbar */}
      <Box
        sx={{
          gridColumn: '1 / 4',
          gridRow: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'grey.900',
          color: 'white',
        }}
      >
        {toolbar}
      </Box>
    </Box>
  );
}
