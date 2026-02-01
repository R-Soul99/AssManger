import { Asset } from '@/domain/entities';
import { AssetData, CategoryData, LocationData } from '@/domain/validators';

export interface AssetFilters {
  locationId?: string;
  categoryId?: number;
  status?: string;
  searchTerm?: string; // Searches tag, description, serial, phone
}

export interface AssetWithRelations {
  asset: Asset;
  category: CategoryData | null;
  location: LocationData | null;
  locationPath?: string; // Full path like "HQ > Main Building > Floor 1 > Room 101"
}

export interface IAssetRepository {
  findById(id: string): Promise<Asset | null>;
  findAll(filters?: AssetFilters): Promise<Asset[]>;
  findAllWithRelations(filters?: AssetFilters): Promise<AssetWithRelations[]>;
  findByLocation(locationId: string): Promise<Asset[]>;
  findByTag(tag: string): Promise<Asset | null>;
  tagExists(tag: string, excludeId?: string): Promise<boolean>;
  save(asset: AssetData): Promise<void>;
  update(id: string, data: Partial<AssetData>): Promise<void>;
  delete(id: string): Promise<void>;
  count(filters?: AssetFilters): Promise<number>;
}
