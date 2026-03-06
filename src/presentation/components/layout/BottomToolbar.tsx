import { Box, IconButton, Button, Divider, Tooltip, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import ComputerIcon from '@mui/icons-material/Computer';
import MonitorIcon from '@mui/icons-material/Monitor';
import PrintIcon from '@mui/icons-material/Print';

/**
 * BottomToolbar - Tool palette and asset/furniture placement buttons
 *
 * From 02-RESEARCH.md lines 479-578
 *
 * Three sections:
 * 1. Tools (Edit, Move, Delete, Zoom) - Available in Phase 3
 * 2. Assets (PC, Phone, Monitor, Printer) - Available in Phase 6
 * 3. Furniture (Desk, Bench, Custom) - Available in Phase 7
 *
 * All buttons are disabled until their respective phases. This establishes
 * the toolbar structure early so users understand the full feature set.
 */
export function BottomToolbar() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        height: '100%',
        bgcolor: 'grey.900',
        color: 'white',
      }}
    >
      {/* Section 1: Tools */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'success.light', fontWeight: 'bold' }}>
          TOOLS
        </Typography>
        <Tooltip title="Available in Phase 3">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 3">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <OpenWithIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 3">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 3">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <SearchIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'grey.700' }} />

      {/* Section 2: Asset Palette */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'info.light', fontWeight: 'bold' }}>
          ASSETS
        </Typography>
        <Tooltip title="Available in Phase 6">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <ComputerIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 6">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <PhoneIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 6">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <MonitorIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 6">
          <span>
            <IconButton disabled size="small" sx={{ color: 'white' }}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'grey.700' }} />

      {/* Section 3: Furniture Palette */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'warning.light', fontWeight: 'bold' }}>
          FURNITURE
        </Typography>
        <Tooltip title="Available in Phase 7">
          <span>
            <Button disabled size="small" variant="outlined" sx={{ color: 'white', borderColor: 'grey.700' }}>
              Desk
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 7">
          <span>
            <Button disabled size="small" variant="outlined" sx={{ color: 'white', borderColor: 'grey.700' }}>
              Bench
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Available in Phase 7">
          <span>
            <Button disabled size="small" variant="outlined" sx={{ color: 'white', borderColor: 'grey.700' }}>
              Custom
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
