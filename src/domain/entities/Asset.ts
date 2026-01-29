import { AssetSchema, AssetData } from '../validators/schemas';
import { CreateResult } from './Location';

export class Asset {
  private constructor(private data: AssetData) {}

  static create(input: unknown): CreateResult<Asset> {
    const result = AssetSchema.safeParse(input);
    if (!result.success) {
      return {
        success: false,
        errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { success: true, entity: new Asset(result.data) };
  }

  get id(): string { return this.data.id; }
  get tag(): string { return this.data.tag; }
  get category(): string { return this.data.category; }
  get description(): string { return this.data.description; }
  get locationId(): string { return this.data.locationId; }
  get serialNumber(): string | undefined { return this.data.serialNumber; }
  get phoneExtension(): string | undefined { return this.data.phoneExtension; }
  get status(): 'active' | 'pending' | 'decommissioned' | 'faulty' | 'maintenance' { return this.data.status; }
  get owner(): string | undefined { return this.data.owner; }
  get costCentre(): string | undefined { return this.data.costCentre; }
  get notes(): string | undefined { return this.data.notes; }
  get cost(): number | undefined { return this.data.cost; }
  get purchaseDate(): Date | undefined { return this.data.purchaseDate; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  // Business logic: Check if asset is expensive (threshold from RESEARCH.md)
  isExpensive(): boolean {
    return (this.cost ?? 0) > 10000;
  }

  toJSON(): AssetData { return { ...this.data }; }
}
