import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';
import { CategoryData, LocationData } from '@/domain/validators';

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
 * Formats a Date or date-like value as an ISO date string (YYYY-MM-DD).
 * Returns empty string for null/undefined.
 */
function formatDate(value: Date | string | null | undefined): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value);
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

export class CsvExportService {
  /** UTF-8 BOM character - ensures Excel opens the file with correct encoding */
  private static readonly UTF8_BOM = '\uFEFF';

  /**
   * Export a list of assets (with joined category and location path) to a CSV file.
   * Opens a save dialog, writes the file, then reveals it in the OS file explorer.
   */
  async exportAssets(
    assets: AssetWithRelations[],
    filename: string = 'assets.csv'
  ): Promise<{ success: true; path: string } | { success: false; error: string }> {
    const headers = [
      'Asset Tag',
      'Description',
      'Category',
      'Location',
      'Status',
      'Serial Number',
      'Phone/Extension',
      'Owner',
      'Cost Centre',
      'Cost',
      'Purchase Date',
      'Notes',
      'Created',
      'Updated',
    ];

    const rows = assets.map(({ asset, category, locationPath }) => [
      escapeCsvField(asset.tag),
      escapeCsvField(asset.description),
      escapeCsvField(category?.name ?? null),
      escapeCsvField(locationPath ?? null),
      escapeCsvField(asset.status),
      escapeCsvField(asset.serialNumber ?? null),
      escapeCsvField(asset.phoneExtension ?? null),
      escapeCsvField(asset.owner ?? null),
      escapeCsvField(asset.costCentre ?? null),
      escapeCsvField(asset.cost ?? null),
      escapeCsvField(formatDate(asset.purchaseDate)),
      escapeCsvField(asset.notes ?? null),
      escapeCsvField(formatTimestamp(asset.createdAt)),
      escapeCsvField(formatTimestamp(asset.updatedAt)),
    ]);

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
