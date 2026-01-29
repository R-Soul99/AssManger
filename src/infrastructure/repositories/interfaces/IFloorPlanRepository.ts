import { FloorPlan } from '@/domain/entities';
import { FloorPlanData } from '@/domain/validators';

export interface IFloorPlanRepository {
  findById(id: string): Promise<FloorPlan | null>;
  findAll(): Promise<FloorPlan[]>;
  findByLocation(locationId: string): Promise<FloorPlan[]>;
  save(floorPlan: FloorPlanData): Promise<void>;
  update(id: string, data: Partial<FloorPlanData>): Promise<void>;
  delete(id: string): Promise<void>;
  hasMarkers(id: string): Promise<boolean>;
  getMarkerCount(id: string): Promise<number>;
}
