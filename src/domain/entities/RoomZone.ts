import { RoomZoneSchema, RoomZoneData } from '../validators/schemas';
import { CreateResult } from './Location';

export class RoomZone {
  private constructor(private data: RoomZoneData) {}

  static create(input: unknown): CreateResult<RoomZone> {
    const result = RoomZoneSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new RoomZone(result.data) };
  }

  get id(): string { return this.data.id; }
  get floorPlanId(): string { return this.data.floorPlanId; }
  get locationId(): string { return this.data.locationId; }
  get normalizedX(): number { return this.data.normalizedX; }
  get normalizedY(): number { return this.data.normalizedY; }
  get normalizedWidth(): number { return this.data.normalizedWidth; }
  get normalizedHeight(): number { return this.data.normalizedHeight; }
  get color(): string { return this.data.color; }
  get name(): string | undefined { return this.data.name; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  toJSON(): RoomZoneData { return { ...this.data }; }
}
