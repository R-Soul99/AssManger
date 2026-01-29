import { LocationSchema, LocationData, LocationType } from '../validators/schemas';

export type CreateResult<T> =
  | { success: true; entity: T }
  | { success: false; errors: string[] };

export class Location {
  private constructor(private data: LocationData) {}

  static create(input: unknown): CreateResult<Location> {
    const result = LocationSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new Location(result.data) };
  }

  get id(): string { return this.data.id; }
  get name(): string { return this.data.name; }
  get type(): LocationType { return this.data.type; }
  get parentId(): string | null { return this.data.parentId; }
  get description(): string | undefined { return this.data.description; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Check if this location can have the given child type
  canHaveChildType(childType: LocationType): boolean {
    const hierarchy: Record<LocationType, LocationType | null> = {
      site: 'building',
      building: 'floor',
      floor: 'room',
      room: null, // rooms cannot have children
    };
    return hierarchy[this.data.type] === childType;
  }

  toJSON(): LocationData { return { ...this.data }; }
}
