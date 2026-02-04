import type { Category } from '@/domain/entities';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository';

let nextId = 4; // seed data uses 1-3

export class MockCategoryRepository implements ICategoryRepository {
  static store: Category[] = [
    { id: 1, name: 'Telephones', parentId: null, description: 'Phone equipment', icon: 'FaPhone', color: '#2196F3', createdAt: new Date(), updatedAt: new Date() },
    { id: 2, name: 'Computers', parentId: null, description: 'Computer equipment', icon: 'FaDesktop', color: '#4CAF50', createdAt: new Date(), updatedAt: new Date() },
    { id: 3, name: 'Medical', parentId: null, description: 'Medical devices', icon: 'FaHospital', color: '#F44336', createdAt: new Date(), updatedAt: new Date() },
  ];

  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const now = new Date();
    const entity: Category = { ...category, id: nextId++, createdAt: now, updatedAt: now };
    MockCategoryRepository.store.push(entity);
    return entity;
  }

  async findAll(): Promise<Category[]> {
    return [...MockCategoryRepository.store];
  }

  async findById(id: number): Promise<Category | null> {
    return MockCategoryRepository.store.find(c => c.id === id) ?? null;
  }

  async update(id: number, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category | null> {
    const idx = MockCategoryRepository.store.findIndex(c => c.id === id);
    if (idx === -1) return null;
    MockCategoryRepository.store[idx] = { ...MockCategoryRepository.store[idx], ...data, updatedAt: new Date() };
    return MockCategoryRepository.store[idx];
  }

  async delete(id: number): Promise<void> {
    MockCategoryRepository.store = MockCategoryRepository.store.filter(c => c.id !== id);
  }
}
