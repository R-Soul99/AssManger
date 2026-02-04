import { Asset } from '@/domain/entities';
import type { AssetData, CategoryData, LocationData } from '@/domain/validators';
import type { IAssetRepository, AssetFilters, AssetWithRelations } from '../interfaces/IAssetRepository';
import { MockCategoryRepository } from './MockCategoryRepository';
import { MockLocationRepository } from './MockLocationRepository';

export class MockAssetRepository implements IAssetRepository {
  // Seed includes special characters (comma, quotes) to exercise CSV escaping in UAT
  static store: AssetData[] = [
    { id: 'bbbaaaaa-bbbb-4ccc-8ddd-000000000101', tag: 'TEL-001', categoryId: 1, description: 'Main desk phone, reception',   locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000004', status: 'active',         serialNumber: 'SN-1001', phoneExtension: '1234',                                                            createdAt: new Date(), updatedAt: new Date() },
    { id: 'bbbaaaaa-bbbb-4ccc-8ddd-000000000102', tag: 'SRV-001', categoryId: 2, description: 'Server "Primary" rack',        locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000005', status: 'active',         serialNumber: 'SN-2001', owner: 'IT Department', costCentre: 'CC-100', notes: 'Hosts main application', cost: 15000, createdAt: new Date(), updatedAt: new Date() },
    { id: 'bbbaaaaa-bbbb-4ccc-8ddd-000000000103', tag: 'TEL-002', categoryId: 1, description: 'IT helpdesk phone',            locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000005', status: 'active',         phoneExtension: '5678',                                                                                     createdAt: new Date(), updatedAt: new Date() },
    { id: 'bbbaaaaa-bbbb-4ccc-8ddd-000000000104', tag: 'PC-001',  categoryId: 2, description: 'Office workstation',           locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000007', status: 'pending',        owner: 'John Smith',                                                                                        createdAt: new Date(), updatedAt: new Date() },
    { id: 'bbbaaaaa-bbbb-4ccc-8ddd-000000000105', tag: 'MED-001', categoryId: 3, description: 'Blood pressure monitor',       locationId: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000004', status: 'decommissioned', serialNumber: 'MED-SN-301', notes: 'Awaiting disposal',                                                       createdAt: new Date(), updatedAt: new Date() },
  ];

  private toEntity(data: AssetData): Asset {
    const result = Asset.create(data);
    if (!result.success) throw new Error(`MockAssetRepository: ${result.errors.join(', ')}`);
    return result.entity;
  }

  private applyFilters(assets: AssetData[], filters?: AssetFilters): AssetData[] {
    if (!filters) return assets;
    let result = assets;
    if (filters.locationId)                result = result.filter(a => a.locationId === filters.locationId);
    if (filters.categoryId !== undefined)  result = result.filter(a => a.categoryId === filters.categoryId);
    if (filters.status)                    result = result.filter(a => a.status === filters.status);
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.tag.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term) ||
        (a.serialNumber?.toLowerCase().includes(term) ?? false) ||
        (a.phoneExtension?.toLowerCase().includes(term) ?? false)
      );
    }
    return result;
  }

  private buildLocationPath(locationId: string): string {
    const parts: string[] = [];
    let currentId: string | null = locationId;
    while (currentId) {
      const loc = MockLocationRepository.store.find(l => l.id === currentId);
      if (!loc) break;
      parts.unshift(loc.name);
      currentId = loc.parentId;
    }
    return parts.join(' > ');
  }

  async findById(id: string): Promise<Asset | null> {
    const data = MockAssetRepository.store.find(a => a.id === id);
    return data ? this.toEntity(data) : null;
  }

  async findAll(filters?: AssetFilters): Promise<Asset[]> {
    return this.applyFilters(MockAssetRepository.store, filters).map(d => this.toEntity(d));
  }

  async findAllWithRelations(filters?: AssetFilters): Promise<AssetWithRelations[]> {
    const filtered = this.applyFilters(MockAssetRepository.store, filters);
    return filtered.map(a => {
      const cat = MockCategoryRepository.store.find(c => c.id === a.categoryId);
      const loc = MockLocationRepository.store.find(l => l.id === a.locationId);
      return {
        asset: this.toEntity(a),
        category: cat ? { ...cat } as unknown as CategoryData : null,
        location: loc ? { ...loc } as LocationData : null,
        locationPath: loc ? this.buildLocationPath(a.locationId) : undefined,
      };
    });
  }

  async findByLocation(locationId: string): Promise<Asset[]> {
    return MockAssetRepository.store.filter(a => a.locationId === locationId).map(d => this.toEntity(d));
  }

  async findByTag(tag: string): Promise<Asset | null> {
    const data = MockAssetRepository.store.find(a => a.tag === tag);
    return data ? this.toEntity(data) : null;
  }

  async tagExists(tag: string, excludeId?: string): Promise<boolean> {
    return MockAssetRepository.store.some(a => a.tag === tag && a.id !== excludeId);
  }

  async save(asset: AssetData): Promise<void> {
    MockAssetRepository.store.push({ ...asset });
  }

  async update(id: string, data: Partial<AssetData>): Promise<void> {
    const idx = MockAssetRepository.store.findIndex(a => a.id === id);
    if (idx !== -1) {
      MockAssetRepository.store[idx] = { ...MockAssetRepository.store[idx], ...data, updatedAt: new Date() };
    }
  }

  async delete(id: string): Promise<void> {
    MockAssetRepository.store = MockAssetRepository.store.filter(a => a.id !== id);
  }

  async count(filters?: AssetFilters): Promise<number> {
    return this.applyFilters(MockAssetRepository.store, filters).length;
  }
}
