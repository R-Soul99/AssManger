
import { Category } from '../../../domain/entities';

export interface ICategoryRepository {
  create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  findAll(): Promise<Category[]>;
  findById(id: number): Promise<Category | null>;
  update(id: number, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category | null>;
  delete(id: number): Promise<void>;
}
