import { InfrastructureSchema, InfrastructureData, InfrastructureType } from '../validators/schemas';
import { CreateResult } from './Location';

export class Infrastructure {
  private constructor(private data: InfrastructureData) {}

  static create(input: unknown): CreateResult<Infrastructure> {
    const result = InfrastructureSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new Infrastructure(result.data) };
  }

  get id(): string { return this.data.id; }
  get floorPlanId(): string { return this.data.floorPlanId; }
  get roomZoneId(): string { return this.data.roomZoneId; }
  get type(): InfrastructureType { return this.data.type; }
  get normalizedX(): number { return this.data.normalizedX; }
  get normalizedY(): number { return this.data.normalizedY; }
  get customFields(): Record<string, any> | undefined { return this.data.customFields; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  toJSON(): InfrastructureData { return { ...this.data }; }
}
