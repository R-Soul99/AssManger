import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';

interface AssetSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * AssetSearchBar - Debounced search input for asset filtering
 *
 * Pattern 2 from 02-RESEARCH.md (Debounced Search)
 *
 * The debouncing logic is handled by the parent component using the
 * useDebounce hook. This component only handles immediate UI updates.
 */
export function AssetSearchBar({ value, onChange, placeholder }: AssetSearchBarProps) {
  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Search assets by tag, description, type, or location"}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange('')} edge="end">
              <ClearIcon />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
}
