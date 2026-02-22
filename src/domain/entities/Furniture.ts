import { FurnitureSchema, FurnitureData, FurnitureType } from '../validators/schemas';
import { CreateResult } from './Location';

export class Furniture {
  private constructor(private data: FurnitureData) {}

  static create(input: unknown): CreateResult<Furniture> {
    const result = FurnitureSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new Furniture(result.data) };
  }

  get id(): string { return this.data.id; }
  get floorPlanId(): string { return this.data.floorPlanId; }
  get roomZoneId(): string { return this.data.roomZoneId; }
  get type(): FurnitureType { return this.data.type; }
  get normalizedX(): number { return this.data.normalizedX; }
  get normalizedY(): number { return this.data.normalizedY; }
  get normalizedWidth(): number { return this.data.normalizedWidth; }
  get normalizedHeight(): number { return this.data.normalizedHeight; }
  get rotation(): number { return this.data.rotation ?? 0; }
  get customFields(): Record<string, any> | undefined { return this.data.customFields; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  toJSON(): FurnitureData { return { ...this.data }; }
}
