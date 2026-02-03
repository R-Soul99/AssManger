/**
 * Stub for CsvExportService — created by plan 03-04 (running in parallel).
 * This minimal stub satisfies the import in AssetBulkActions until the
 * full implementation is delivered.  Plan 03-04 will overwrite this file.
 */
import { AssetWithRelations } from '@/infrastructure/repositories/interfaces/IAssetRepository';

export interface CsvExportResult {
  success: boolean;
  error?: string;
  path?: string;
}

export class CsvExportService {
  async exportAssets(
    _assets: AssetWithRelations[],
    _filename: string
  ): Promise<CsvExportResult> {
    // Stub — full implementation provided by plan 03-04
    return { success: true, path: '' };
  }
}
