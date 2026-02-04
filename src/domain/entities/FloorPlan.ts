import { FloorPlanSchema, FloorPlanData } from '../validators/schemas';
import { CreateResult } from './Location';

export class FloorPlan {
  private constructor(private data: FloorPlanData) {}

  static create(input: unknown): CreateResult<FloorPlan> {
    const result = FloorPlanSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new FloorPlan(result.data) };
  }

  get id(): string { return this.data.id; }
  get name(): string { return this.data.name; }
  get locationId(): string | null { return this.data.locationId; }
  get displayOrder(): number { return this.data.displayOrder ?? 0; }
  get imageRelativePath(): string { return this.data.imageRelativePath; }
  get imageWidth(): number { return this.data.imageWidth; }
  get imageHeight(): number { return this.data.imageHeight; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Calculate aspect ratio for rendering
  getAspectRatio(): number {
    return this.data.imageWidth / this.data.imageHeight;
  }

  toJSON(): FloorPlanData { return { ...this.data }; }
}
