import { useState } from 'react';

export type ColumnKey =
  | 'icon'
  | 'tag'
  | 'description'
  | 'category'
  | 'location'
  | 'status'
  | 'serialNumber'
  | 'phone'
  | 'owner'
  | 'costCentre';

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

export const COLUMNS: ColumnConfig[] = [
  { key: 'icon', label: 'Icon', defaultVisible: true },
  { key: 'tag', label: 'Asset Tag', defaultVisible: true },
  { key: 'description', label: 'Description', defaultVisible: true },
  { key: 'category', label: 'Category', defaultVisible: true },
  { key: 'location', label: 'Location', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'serialNumber', label: 'Serial Number', defaultVisible: false },
  { key: 'phone', label: 'Phone/Ext', defaultVisible: false },
  { key: 'owner', label: 'Owner', defaultVisible: false },
  { key: 'costCentre', label: 'Cost Centre', defaultVisible: false },
];

function buildDefaults(): Record<ColumnKey, boolean> {
  return COLUMNS.reduce((acc, col) => {
    acc[col.key] = col.defaultVisible;
    return acc;
  }, {} as Record<ColumnKey, boolean>);
}

/**
 * Manages column visibility state with localStorage persistence.
 * Defaults are defined by the COLUMNS configuration array.
 * Toggling a column immediately persists the new state.
 */
export function useColumnVisibility(storageKey: string = 'asset-column-visibility') {
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        // Merge with defaults so new columns added later get their default value
        const defaults = buildDefaults();
        return { ...defaults, ...parsed } as Record<ColumnKey, boolean>;
      }
    } catch {
      // Invalid JSON or localStorage unavailable — fall through to defaults
    }
    return buildDefaults();
  });

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // localStorage quota exceeded — silently ignore
      }
      return updated;
    });
  };

  const isColumnVisible = (key: ColumnKey): boolean => visibleColumns[key] ?? true;

  return { visibleColumns, toggleColumn, isColumnVisible, COLUMNS };
}
