
import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Category } from '../../../domain/entities';
import { ICategoryRepository } from '../interfaces';
import * as schema from '../../database/schema';
import { categories } from '../../database/schema';

export class SqliteCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: BetterSQLite3Database<typeof schema>) {}

  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const now = new Date();
    const result = await this.db.insert(categories).values({
      name: category.name,
      parentId: category.parentId ?? null,
      description: category.description ?? null,
      icon: category.icon,
      color: category.color,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0];
  }

  async findAll(): Promise<Category[]> {
    return this.db.select().from(categories);
  }

  async findById(id: number): Promise<Category | null> {
    const result = await this.db.select().from(categories).where(eq(categories.id, id));
    return result[0] || null;
  }

  async update(id: number, category: Partial<Omit<Category, 'id'>>): Promise<Category | null> {
    const now = new Date();
    await this.db.update(categories).set({ ...category, updatedAt: now }).where(eq(categories.id, id));
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }
}
