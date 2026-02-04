import { Location } from '@/domain/entities';
import type { LocationData, LocationType } from '@/domain/validators';
import type { ILocationRepository } from '../interfaces/ILocationRepository';

// UUIDs use version 4 / variant 1 format so they pass Zod's uuid() check
export class MockLocationRepository implements ILocationRepository {
  static store: LocationData[] = [
    { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001', name: 'HQ',             type: 'site',     parentId: null,                                       createdAt: new Date(), updatedAt: new Date() },
    { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002', name: 'Main Building',  type: 'building', parentId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001',    createdAt: new Date(), updatedAt: new Date() },
    { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003', name: 'Ground Floor',   type: 'floor',    parentId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002',    createdAt: new Date(), updatedAt: new Date() },
    { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000004', name: 'Reception',      type: 'room',     parentId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003',    createdAt: new Date(), updatedAt: new Date() },
    { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000005', name: 'IT Room',        type: 'room',     parentId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003',    createdAt: new Date(), updatedAt: new Date() },
    { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000006', name: 'First Floor',    type: 'floor',    parentId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000002',    createdAt: new Date(), updatedAt: new Date() },
    { id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000007', name: 'Office 101',     type: 'room',     parentId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000006',    createdAt: new Date(), updatedAt: new Date() },
  ];

  private toEntity(data: LocationData): Location {
    const result = Location.create(data);
    if (!result.success) throw new Error(`MockLocationRepository: ${result.errors.join(', ')}`);
    return result.entity;
  }

  async findById(id: string): Promise<Location | null> {
    const data = MockLocationRepository.store.find(l => l.id === id);
    return data ? this.toEntity(data) : null;
  }

  async findAll(): Promise<Location[]> {
    return MockLocationRepository.store.map(d => this.toEntity(d));
  }

  async findByType(type: LocationType): Promise<Location[]> {
    return MockLocationRepository.store.filter(l => l.type === type).map(d => this.toEntity(d));
  }

  async findChildren(parentId: string): Promise<Location[]> {
    return MockLocationRepository.store.filter(l => l.parentId === parentId).map(d => this.toEntity(d));
  }

  async findRoots(): Promise<Location[]> {
    return MockLocationRepository.store.filter(l => l.parentId === null).map(d => this.toEntity(d));
  }

  async save(location: LocationData): Promise<void> {
    MockLocationRepository.store.push({ ...location });
  }

  async update(id: string, data: Partial<LocationData>): Promise<void> {
    const idx = MockLocationRepository.store.findIndex(l => l.id === id);
    if (idx !== -1) {
      MockLocationRepository.store[idx] = { ...MockLocationRepository.store[idx], ...data, updatedAt: new Date() };
    }
  }

  async delete(id: string): Promise<void> {
    MockLocationRepository.store = MockLocationRepository.store.filter(l => l.id !== id);
  }

  async hasChildren(id: string): Promise<boolean> {
    return MockLocationRepository.store.some(l => l.parentId === id);
  }

  async hasAssets(id: string): Promise<boolean> {
    // Lazy import avoids circular dependency with MockAssetRepository
    const { MockAssetRepository } = await import('./MockAssetRepository');
    return MockAssetRepository.store.some(a => a.locationId === id);
  }
}
