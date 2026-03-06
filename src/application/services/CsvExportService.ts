import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import { CategoryData, LocationData } from '@/domain/validators';
import { AssetType } from '@/domain/entities';

/**
 * Escapes a single CSV field per RFC 4180 rules:
 * - null/undefined becomes empty string
 * - Fields containing comma, double-quote, or newline are wrapped in double-quotes
 * - Internal double-quotes are escaped by doubling them
 */
function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Formats a Date or date-like value as a full ISO timestamp.
 * Returns empty string for null/undefined.
 */
function formatTimestamp(value: Date | string | null | undefined): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

// Column definitions for asset export — keys match useColumnVisibility keys
type AssetColumnKey = 'tag' | 'description' | 'category' | 'location' | 'status' | 'serialNumber' | 'phone' | 'owner' | 'costCentre';

const ASSET_COLUMN_DEFS: Record<AssetColumnKey, { header: string; extract: (item: AssetWithRelations) => string | number | null | undefined }> = {
  tag:          { header: 'Asset Tag',        extract: ({ asset })        => asset.tag },
  description:  { header: 'Description',      extract: ({ asset })        => asset.description },
  category:     { header: 'Category',         extract: ({ category })     => category?.name ?? null },
  location:     { header: 'Location',         extract: ({ locationPath }) => locationPath ?? null },
  status:       { header: 'Status',           extract: ({ asset })        => asset.status },
  serialNumber: { header: 'Serial Number',    extract: ({ asset })        => asset.serialNumber ?? null },
  phone:        { header: 'Phone/Extension',  extract: ({ asset })        => asset.phoneExtension ?? null },
  owner:        { header: 'Owner',            extract: ({ asset })        => asset.owner ?? null },
  costCentre:   { header: 'Cost Centre',      extract: ({ asset })        => asset.costCentre ?? null },
};

const ALL_ASSET_COLUMNS: AssetColumnKey[] = ['tag', 'description', 'category', 'location', 'status', 'serialNumber', 'phone', 'owner', 'costCentre'];

export class CsvExportService {
  /** UTF-8 BOM character - ensures Excel opens the file with correct encoding */
  private static readonly UTF8_BOM = '\uFEFF';

  /**
   * Export assets to CSV.  `columns` controls which fields appear — defaults to
   * all when omitted.  Keys match the column-visibility keys used in the asset
   * table (minus 'icon', which has no data value).
   */
  async exportAssets(
    assets: AssetWithRelations[],
    filename: string = 'assets.csv',
    columns: string[] = ALL_ASSET_COLUMNS
  ): Promise<{ success: true; path: string } | { success: false; error: string }> {
    const cols = columns.filter((k): k is AssetColumnKey => k in ASSET_COLUMN_DEFS);

    const headers = cols.map(k => ASSET_COLUMN_DEFS[k].header);
    const rows = assets.map(item =>
      cols.map(k => escapeCsvField(ASSET_COLUMN_DEFS[k].extract(item)))
    );

    return this.writeCSV(headers, rows, filename);
  }

  /**
   * Export locations to CSV.
   */
  async exportLocations(
    locations: LocationData[],
    filename: string = 'locations.csv'
  ): Promise<{ success: true; path: string } | { success: false; error: string }> {
    const headers = ['ID', 'Name', 'Type', 'Parent ID', 'Description', 'Created', 'Updated'];

    const rows = locations.map((loc) => [
      escapeCsvField(loc.id),
      escapeCsvField(loc.name),
      escapeCsvField(loc.type),
      escapeCsvField(loc.parentId),
      escapeCsvField(loc.description ?? null),
      escapeCsvField(formatTimestamp(loc.createdAt)),
      escapeCsvField(formatTimestamp(loc.updatedAt)),
    ]);

    return this.writeCSV(headers, rows, filename);
  }

  /**
   * Export categories to CSV.
   * @deprecated Use exportAssetTypes instead. Kept for backward compatibility.
   */
  async exportCategories(
    categories: CategoryData[],
    filename: string = 'categories.csv'
  ): Promise<{ success: true; path: string } | { success: false; error: string }> {
    const headers = ['ID', 'Name', 'Description', 'Icon', 'Color', 'Created', 'Updated'];

    const rows = categories.map((cat) => [
      escapeCsvField(cat.id),
      escapeCsvField(cat.name),
      escapeCsvField(cat.description ?? null),
      escapeCsvField(cat.icon),
      escapeCsvField(cat.color),
      escapeCsvField(formatTimestamp(cat.createdAt)),
      escapeCsvField(formatTimestamp(cat.updatedAt)),
    ]);

    return this.writeCSV(headers, rows, filename);
  }

  /**
   * Export asset types to CSV.
   */
  async exportAssetTypes(
    assetTypes: AssetType[],
    filename: string = 'asset_types.csv'
  ): Promise<{ success: true; path: string } | { success: false; error: string }> {
    const headers = ['ID', 'Name', 'Description', 'Icon', 'Color', 'Is System Type', 'Created', 'Updated'];

    const rows = assetTypes.map((type) => [
      escapeCsvField(type.id),
      escapeCsvField(type.name),
      escapeCsvField(type.description ?? null),
      escapeCsvField(type.icon),
      escapeCsvField(type.color),
      escapeCsvField(type.isSystemType ? 'Yes' : 'No'),
      escapeCsvField(formatTimestamp(type.createdAt)),
      escapeCsvField(formatTimestamp(type.updatedAt)),
    ]);

    return this.writeCSV(headers, rows, filename);
  }

  /**
   * Core write logic: assembles CSV string with UTF-8 BOM, opens save dialog,
   * writes the encoded file, and reveals the directory in the OS explorer.
   */
  private async writeCSV(
    headers: string[],
    rows: string[][],
    defaultFilename: string
  ): Promise<{ success: true; path: string } | { success: false; error: string }> {
    try {
      const csvContent =
        CsvExportService.UTF8_BOM +
        headers.map((h) => escapeCsvField(h)).join(',') +
        '\n' +
        rows.map((row) => row.join(',')).join('\n');

      const filePath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (!filePath) {
        return { success: false, error: 'Export cancelled' };
      }

      const encoder = new TextEncoder();
      await writeFile(filePath, encoder.encode(csvContent));

      // Reveal the exported file in the OS file explorer
      await revealItemInDir(filePath);

      return { success: true, path: filePath };
    } catch (error) {
      return {
        success: false,
        error: 'Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }
}
