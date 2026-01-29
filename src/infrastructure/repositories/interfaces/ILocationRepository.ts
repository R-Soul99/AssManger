import { Location } from '@/domain/entities';
import { LocationData, LocationType } from '@/domain/validators';

export interface ILocationRepository {
  findById(id: string): Promise<Location | null>;
  findAll(): Promise<Location[]>;
  findByType(type: LocationType): Promise<Location[]>;
  findChildren(parentId: string): Promise<Location[]>;
  findRoots(): Promise<Location[]>; // Sites (no parent)
  save(location: LocationData): Promise<void>;
  update(id: string, data: Partial<LocationData>): Promise<void>;
  delete(id: string): Promise<void>;
  hasChildren(id: string): Promise<boolean>;
  hasAssets(id: string): Promise<boolean>;
}
