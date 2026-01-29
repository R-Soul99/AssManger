import { Asset } from '@/domain/entities';
import { AssetData } from '@/domain/validators';

export interface AssetFilters {
  locationId?: string;
  category?: string;
  status?: string;
  searchTerm?: string; // Searches tag, description, serial, phone
}

export interface IAssetRepository {
  findById(id: string): Promise<Asset | null>;
  findAll(filters?: AssetFilters): Promise<Asset[]>;
  findByLocation(locationId: string): Promise<Asset[]>;
  findByTag(tag: string): Promise<Asset | null>;
  tagExists(tag: string, excludeId?: string): Promise<boolean>;
  save(asset: AssetData): Promise<void>;
  update(id: string, data: Partial<AssetData>): Promise<void>;
  delete(id: string): Promise<void>;
  count(filters?: AssetFilters): Promise<number>;
}
