import { MarkerSchema, MarkerData } from '../validators/schemas';
import { CreateResult } from './Location';

export class Marker {
  private constructor(private data: MarkerData) {}

  static create(input: unknown): CreateResult<Marker> {
    // Pre-process: clamp coordinates if slightly outside range (CONTEXT.md decision)
    const processed = typeof input === 'object' && input !== null
      ? {
          ...input,
          normalizedX: Marker.clampCoordinate((input as any).normalizedX),
          normalizedY: Marker.clampCoordinate((input as any).normalizedY),
        }
      : input;

    const result = MarkerSchema.safeParse(processed);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new Marker(result.data) };
  }

  // Clamp coordinate to 0.0-1.0 range (silently, per CONTEXT.md)
  private static clampCoordinate(value: unknown): number {
    if (typeof value !== 'number' || isNaN(value)) return value as any;
    return Math.max(0, Math.min(1, value));
  }

  get id(): string { return this.data.id; }
  get floorPlanId(): string { return this.data.floorPlanId; }
  get assetId(): string { return this.data.assetId; }
  get normalizedX(): number { return this.data.normalizedX; }
  get normalizedY(): number { return this.data.normalizedY; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  toJSON(): MarkerData { return { ...this.data }; }
}
