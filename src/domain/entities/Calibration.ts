import { CalibrationSchema, CalibrationData } from '../validators/schemas';
import { CreateResult } from './Location';

export class Calibration {
  private constructor(private data: CalibrationData) {}

  static create(input: unknown): CreateResult<Calibration> {
    const result = CalibrationSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new Calibration(result.data) };
  }

  get id(): string { return this.data.id; }
  get floorPlanId(): string { return this.data.floorPlanId; }
  get point1X(): number { return this.data.point1X; }
  get point1Y(): number { return this.data.point1Y; }
  get point2X(): number { return this.data.point2X; }
  get point2Y(): number { return this.data.point2Y; }
  get realWorldDistance(): number { return this.data.realWorldDistance; }
  get units(): 'metres' | 'feet' { return this.data.units; }
  get scale(): number { return this.data.scale; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Calculate distance between two normalized points using this calibration
  calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    // Calculate normalized distance using Euclidean distance
    const normalizedDistance = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
    );

    // Convert to real-world units using scale
    return normalizedDistance * this.data.scale;
  }

  toJSON(): CalibrationData { return { ...this.data }; }
}
