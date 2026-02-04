import { FloorPlan } from '@/domain/entities';
import type { FloorPlanData } from '@/domain/validators';
import type { IFloorPlanRepository } from '../interfaces/IFloorPlanRepository';

export class MockFloorPlanRepository implements IFloorPlanRepository {
  static store: FloorPlanData[] = [
    { id: 'bbbbbbbb-cccc-4ddd-8eee-000000000001', name: 'Ground Floor Plan',  locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003', imageRelativePath: 'floor_plans/ground.png', imageWidth: 1200, imageHeight: 800, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: 'bbbbbbbb-cccc-4ddd-8eee-000000000002', name: 'First Floor Plan',   locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000006', imageRelativePath: 'floor_plans/first.png',  imageWidth: 1200, imageHeight: 800, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: 'bbbbbbbb-cccc-4ddd-8eee-000000000003', name: 'Unassigned Import',  locationId: null,                                   imageRelativePath: 'floor_plans/import.png', imageWidth: 800,  imageHeight: 600, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() },
  ];

  private toEntity(data: FloorPlanData): FloorPlan {
    const result = FloorPlan.create(data);
    if (!result.success) throw new Error('MockFloorPlanRepository: ' + result.errors.join(', '));
    return result.entity;
  }

  async findById(id: string): Promise<FloorPlan | null> {
    const data = MockFloorPlanRepository.store.find(fp => fp.id === id);
    return data ? this.toEntity(data) : null;
  }

  async findAll(): Promise<FloorPlan[]> {
    return MockFloorPlanRepository.store.map(d => this.toEntity(d));
  }

  async findByLocation(locationId: string): Promise<FloorPlan[]> {
    return MockFloorPlanRepository.store
      .filter(fp => fp.locationId === locationId)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map(d => this.toEntity(d));
  }

  async findUnassigned(): Promise<FloorPlan[]> {
    return MockFloorPlanRepository.store
      .filter(fp => fp.locationId === null)
      .map(d => this.toEntity(d));
  }

  async save(floorPlan: FloorPlanData): Promise<void> {
    MockFloorPlanRepository.store.push({ ...floorPlan });
  }

  async update(id: string, data: Partial<FloorPlanData>): Promise<void> {
    const idx = MockFloorPlanRepository.store.findIndex(fp => fp.id === id);
    if (idx !== -1) {
      MockFloorPlanRepository.store[idx] = { ...MockFloorPlanRepository.store[idx], ...data, updatedAt: new Date() };
    }
  }

  async delete(id: string): Promise<void> {
    MockFloorPlanRepository.store = MockFloorPlanRepository.store.filter(fp => fp.id !== id);
  }

  async hasMarkers(_id: string): Promise<boolean> {
    // No markers table in mock
    return false;
  }

  async getMarkerCount(_id: string): Promise<number> {
    // No markers table in mock
    return 0;
  }

  async reorder(_locationId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const idx = MockFloorPlanRepository.store.findIndex(fp => fp.id === orderedIds[i]);
      if (idx !== -1) {
        MockFloorPlanRepository.store[idx] = { ...MockFloorPlanRepository.store[idx], displayOrder: i };
      }
    }
  }
}
