import { Marker } from '@/domain/entities';
import { MarkerData } from '@/domain/validators';

export interface IMarkerRepository {
  findById(id: string): Promise<Marker | null>;
  findByFloorPlan(floorPlanId: string): Promise<Marker[]>;
  findByAsset(assetId: string): Promise<Marker[]>;
  save(marker: MarkerData): Promise<void>;
  update(id: string, data: Partial<MarkerData>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByFloorPlan(floorPlanId: string): Promise<void>;
  deleteByAsset(assetId: string): Promise<void>;
}
