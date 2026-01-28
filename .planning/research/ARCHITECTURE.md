# Architecture Research

**Domain:** Asset Management with Spatial/Floor Plan Visualization
**Researched:** 2026-01-28
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Asset UI   │  │  Floor Plan  │  │  Search &    │              │
│  │  Components  │  │    Viewer    │  │  Export UI   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
├─────────┴─────────────────┴──────────────────┴───────────────────────┤
│                    APPLICATION/SERVICE LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Asset     │  │  Floor Plan  │  │ Measurement  │              │
│  │   Service    │  │   Service    │  │   Service    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────┴─────────────────┴──────────────────┴───────┐              │
│  │          Coordinate Transform Service              │              │
│  └──────────────────────────┬─────────────────────────┘              │
│                             │                                         │
├─────────────────────────────┴─────────────────────────────────────────┤
│                     DOMAIN/BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Asset     │  │  FloorPlan   │  │    Marker    │              │
│  │   Entity     │  │   Entity     │  │   Entity     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Calibration │  │  Coordinate  │  │  Location    │              │
│  │   Entity     │  │   System     │  │  Hierarchy   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                  DATA ACCESS/REPOSITORY LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Asset     │  │  FloorPlan   │  │    Marker    │              │
│  │  Repository  │  │  Repository  │  │  Repository  │              │
│  │  (Interface) │  │  (Interface) │  │  (Interface) │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────┴─────────────────┴──────────────────┴───────┐              │
│  │         File Storage Repository (Interface)        │              │
│  └────────────────────────┬───────────────────────────┘              │
│                           │                                           │
├───────────────────────────┴───────────────────────────────────────────┤
│                    INFRASTRUCTURE/PERSISTENCE LAYER                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   SQLite     │  │  PostgreSQL  │  │  Local File  │              │
│  │  Repository  │  │  Repository  │  │   Storage    │              │
│  │     Impl     │  │     Impl     │  │     Impl     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────────────────────────────────────────┐                │
│  │          Cloud Object Storage Impl               │                │
│  │        (S3, Azure Blob, Google Cloud)            │                │
│  └──────────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Asset UI Components** | Display asset lists, forms, hierarchical location trees | React/Vue components with state management |
| **Floor Plan Viewer** | Render floor plan images, handle zoom/pan, display markers | Canvas/SVG-based viewer with interactive overlays |
| **Search & Export UI** | Asset search interface, CSV export trigger | Form components with filtering logic |
| **Asset Service** | Asset CRUD operations, business validation | Service class orchestrating repositories |
| **Floor Plan Service** | Floor plan loading, marker management | Service handling spatial data operations |
| **Measurement Service** | Calculate real-world distances from pixel coordinates | Math service using calibration data |
| **Coordinate Transform Service** | Convert between pixel, normalized, and real-world coordinates | Transform matrix calculations |
| **Domain Entities** | Business objects with validation rules | TypeScript classes/interfaces |
| **Repository Interfaces** | Abstract data access contracts | TypeScript interfaces |
| **Repository Implementations** | Concrete database/storage adapters | Database-specific implementations |
| **File Storage** | Persistent storage for floor plan images | Local filesystem or cloud object storage |

## Recommended Project Structure

```
src/
├── presentation/              # UI Layer
│   ├── components/
│   │   ├── assets/           # Asset management UI
│   │   │   ├── AssetList.tsx
│   │   │   ├── AssetForm.tsx
│   │   │   └── LocationTree.tsx
│   │   ├── floorplan/        # Floor plan visualization
│   │   │   ├── FloorPlanViewer.tsx
│   │   │   ├── MarkerOverlay.tsx
│   │   │   └── CalibrationTool.tsx
│   │   └── export/           # Search & export
│   │       ├── SearchPanel.tsx
│   │       └── ExportDialog.tsx
│   └── hooks/                # React hooks for state/logic
│       ├── useAssets.ts
│       └── useFloorPlan.ts
├── application/              # Application/Service Layer
│   ├── services/
│   │   ├── AssetService.ts
│   │   ├── FloorPlanService.ts
│   │   ├── MeasurementService.ts
│   │   └── CoordinateTransformService.ts
│   └── dto/                  # Data Transfer Objects
│       ├── AssetDto.ts
│       └── MarkerDto.ts
├── domain/                   # Domain/Business Logic Layer
│   ├── entities/
│   │   ├── Asset.ts
│   │   ├── FloorPlan.ts
│   │   ├── Marker.ts
│   │   ├── Calibration.ts
│   │   ├── CoordinateSystem.ts
│   │   └── LocationHierarchy.ts
│   └── validators/
│       ├── AssetValidator.ts
│       └── CalibrationValidator.ts
├── infrastructure/           # Data Access/Repository Layer
│   ├── repositories/
│   │   ├── interfaces/       # Repository contracts
│   │   │   ├── IAssetRepository.ts
│   │   │   ├── IFloorPlanRepository.ts
│   │   │   ├── IMarkerRepository.ts
│   │   │   └── IFileStorageRepository.ts
│   │   ├── sqlite/          # SQLite implementations
│   │   │   ├── SqliteAssetRepository.ts
│   │   │   ├── SqliteFloorPlanRepository.ts
│   │   │   └── SqliteMarkerRepository.ts
│   │   ├── postgres/        # PostgreSQL implementations
│   │   │   ├── PostgresAssetRepository.ts
│   │   │   ├── PostgresFloorPlanRepository.ts
│   │   │   └── PostgresMarkerRepository.ts
│   │   └── storage/         # File storage implementations
│   │       ├── LocalFileStorage.ts
│   │       └── CloudObjectStorage.ts
│   └── database/
│       ├── migrations/       # Database schema versions
│       └── connection.ts     # Database connection factory
└── shared/                   # Shared utilities
    ├── types/                # Shared TypeScript types
    └── utils/                # Helper functions
```

### Structure Rationale

- **presentation/:** Clean separation of UI from business logic, organized by feature domains (assets, floor plans, export). React hooks abstract state management details.
- **application/:** Service layer orchestrates use cases, coordinates between domain and repositories. DTOs ensure presentation layer doesn't couple to domain entities.
- **domain/:** Framework-agnostic business logic. Entities contain validation rules and business constraints. No dependencies on UI or database.
- **infrastructure/:** All external dependencies isolated here. Repository pattern with interfaces enables clean database migration path (SQLite → PostgreSQL).
- **shared/:** Cross-cutting concerns like types, utilities avoid circular dependencies.

## Architectural Patterns

### Pattern 1: Repository Pattern with Interface Abstraction

**What:** Abstract data access behind interfaces, with concrete implementations for each database type. The domain and application layers depend on interfaces, not implementations.

**When to use:** Critical for this project to support SQLite → PostgreSQL migration without touching business logic.

**Trade-offs:**
- **Pros:** Clean migration path, testability (mock repositories), swappable storage backends
- **Cons:** More initial code, potential over-abstraction for simple CRUD

**Example:**
```typescript
// Repository interface in domain layer
export interface IAssetRepository {
  findById(id: string): Promise<Asset | null>;
  findAll(): Promise<Asset[]>;
  save(asset: Asset): Promise<void>;
  delete(id: string): Promise<void>;
}

// SQLite implementation
export class SqliteAssetRepository implements IAssetRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Asset | null> {
    const row = await this.db.get('SELECT * FROM assets WHERE id = ?', id);
    return row ? this.mapRowToEntity(row) : null;
  }
  // ... other methods
}

// PostgreSQL implementation (future)
export class PostgresAssetRepository implements IAssetRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<Asset | null> {
    const result = await this.pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }
  // ... other methods
}

// Service layer uses interface, not concrete implementation
export class AssetService {
  constructor(private assetRepo: IAssetRepository) {}

  async getAsset(id: string): Promise<Asset> {
    const asset = await this.assetRepo.findById(id);
    if (!asset) throw new Error('Asset not found');
    return asset;
  }
}
```

### Pattern 2: Normalized Coordinate System

**What:** Store marker positions using normalized coordinates (0.0 to 1.0) relative to image dimensions, not absolute pixel values. Convert to pixels only during rendering.

**When to use:** Essential for spatial data that must remain valid when floor plan images are resized, re-exported, or displayed at different resolutions.

**Trade-offs:**
- **Pros:** Resolution-independent, works across different screen sizes, simpler data model
- **Cons:** Requires conversion logic in viewer, slight performance overhead during rendering

**Example:**
```typescript
// Domain entity
export class Marker {
  id: string;
  floorPlanId: string;
  assetId: string;
  normalizedX: number;  // 0.0 to 1.0
  normalizedY: number;  // 0.0 to 1.0

  // Validation ensures coordinates are normalized
  constructor(data: MarkerData) {
    if (data.normalizedX < 0 || data.normalizedX > 1) {
      throw new Error('X coordinate must be between 0 and 1');
    }
    if (data.normalizedY < 0 || data.normalizedY > 1) {
      throw new Error('Y coordinate must be between 0 and 1');
    }
    // ... assign properties
  }
}

// Coordinate transformation service
export class CoordinateTransformService {
  // Convert normalized to pixel coordinates for rendering
  normalizedToPixel(
    normalized: { x: number; y: number },
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number } {
    return {
      x: normalized.x * imageWidth,
      y: normalized.y * imageHeight
    };
  }

  // Convert pixel to normalized for storage
  pixelToNormalized(
    pixel: { x: number; y: number },
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number } {
    return {
      x: pixel.x / imageWidth,
      y: pixel.y / imageHeight
    };
  }
}

// Floor plan viewer uses transformation
export function FloorPlanViewer({ markers, imageWidth, imageHeight }) {
  const transformService = new CoordinateTransformService();

  return (
    <div>
      {markers.map(marker => {
        const pixel = transformService.normalizedToPixel(
          { x: marker.normalizedX, y: marker.normalizedY },
          imageWidth,
          imageHeight
        );
        return <MarkerPin key={marker.id} x={pixel.x} y={pixel.y} />;
      })}
    </div>
  );
}
```

### Pattern 3: Calibration-Based Measurement

**What:** Store calibration data (known real-world distance between two points) to convert normalized coordinates into real-world measurements. Use linear transformation for distance calculations.

**When to use:** Required for accurate measurement tools when floor plans don't have consistent scale or are hand-drawn/photographed.

**Trade-offs:**
- **Pros:** Accurate measurements without CAD metadata, user-friendly calibration process
- **Cons:** Assumes uniform scale (no perspective distortion), manual calibration step required

**Example:**
```typescript
// Calibration entity
export class Calibration {
  id: string;
  floorPlanId: string;
  point1: { normalizedX: number; normalizedY: number };
  point2: { normalizedX: number; normalizedY: number };
  realWorldDistance: number;  // e.g., 4.0 meters
  unit: 'meters' | 'feet';

  // Calculate pixels-per-unit for this floor plan
  getPixelsPerUnit(imageWidth: number, imageHeight: number): number {
    const dx = (this.point2.normalizedX - this.point1.normalizedX) * imageWidth;
    const dy = (this.point2.normalizedY - this.point1.normalizedY) * imageHeight;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    return pixelDistance / this.realWorldDistance;
  }
}

// Measurement service
export class MeasurementService {
  constructor(
    private floorPlanRepo: IFloorPlanRepository,
    private transformService: CoordinateTransformService
  ) {}

  async calculateRealWorldDistance(
    floorPlanId: string,
    point1: { normalizedX: number; normalizedY: number },
    point2: { normalizedX: number; normalizedY: number }
  ): Promise<{ distance: number; unit: string }> {
    const floorPlan = await this.floorPlanRepo.findById(floorPlanId);
    if (!floorPlan.calibration) {
      throw new Error('Floor plan not calibrated');
    }

    const imageWidth = floorPlan.imageWidth;
    const imageHeight = floorPlan.imageHeight;

    // Convert to pixels
    const pixel1 = this.transformService.normalizedToPixel(point1, imageWidth, imageHeight);
    const pixel2 = this.transformService.normalizedToPixel(point2, imageWidth, imageHeight);

    // Calculate pixel distance
    const dx = pixel2.x - pixel1.x;
    const dy = pixel2.y - pixel1.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    // Convert to real-world units
    const pixelsPerUnit = floorPlan.calibration.getPixelsPerUnit(imageWidth, imageHeight);
    const realWorldDistance = pixelDistance / pixelsPerUnit;

    return {
      distance: realWorldDistance,
      unit: floorPlan.calibration.unit
    };
  }
}
```

## Data Flow

### Request Flow

#### Asset CRUD Operations
```
[User Action: Add/Edit Asset]
    ↓
[AssetForm Component] → [AssetService.save()]
    ↓                          ↓
[Validation]            [Asset Entity Validation]
    ↓                          ↓
[Update UI State]       [IAssetRepository.save()]
                               ↓
                        [SQLite/Postgres Implementation]
                               ↓
                        [Database INSERT/UPDATE]
```

#### Floor Plan Rendering with Markers
```
[User Action: Open Floor Plan]
    ↓
[FloorPlanViewer Component] → [FloorPlanService.loadFloorPlan()]
    ↓                                ↓
[Load Image File]              [IFloorPlanRepository.findById()]
    ↓                                ↓
[Get Markers]                  [IMarkerRepository.findByFloorPlanId()]
    ↓                                ↓
[CoordinateTransformService]   [Return Normalized Coordinates]
    ↓
[Render Markers at Pixel Positions]
```

#### Marker Placement
```
[User Action: Click on Floor Plan]
    ↓
[FloorPlanViewer: Capture Pixel Coordinates]
    ↓
[CoordinateTransformService.pixelToNormalized()]
    ↓
[FloorPlanService.addMarker()]
    ↓
[Marker Entity: Validate Normalized Coords]
    ↓
[IMarkerRepository.save()]
    ↓
[Database INSERT with Normalized Coordinates]
    ↓
[Update UI: Render New Marker]
```

#### Measurement Calculation
```
[User Action: Measure Distance]
    ↓
[FloorPlanViewer: Capture Two Points (Pixels)]
    ↓
[CoordinateTransformService.pixelToNormalized()]
    ↓
[MeasurementService.calculateRealWorldDistance()]
    ↓
[Load Calibration Data]
    ↓
[Calculate Pixel Distance → Real-World Distance]
    ↓
[Display Result in UI (e.g., "4.2 meters")]
```

### State Management

```
[Application State Store]
    ↓ (subscribe)
[UI Components] ←→ [Actions] → [Services] → [Repositories] → [Database]
    ↓                              ↓
[Render Updates]           [Business Logic]
```

### Key Data Flows

1. **Asset with Location Flow:** User selects location from hierarchy → Service validates location exists → Asset saved with location reference → UI updates to show asset in location tree
2. **Floor Plan Upload Flow:** User uploads image → File stored via IFileStorageRepository → FloorPlan entity created with file path and image dimensions → Calibration tool enabled for measurement setup
3. **CSV Export Flow:** User triggers export → Service queries all assets with location/marker data → Transform to CSV format → Generate file → Browser download
4. **Database Migration Flow:** Application startup → Check repository implementation type (SQLite/Postgres) → Inject correct repository implementations → Business logic operates identically

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Single-user desktop** | SQLite database, local file storage, monolithic application. This is the initial target. |
| **Multi-user local network** | Consider PostgreSQL for concurrent writes, shared network storage for floor plan images, add basic user authentication |
| **100+ users, cloud deployment** | PostgreSQL required, cloud object storage (S3/Azure Blob), stateless application servers behind load balancer, consider caching layer (Redis) for floor plan metadata |
| **1000+ users, enterprise** | Read replicas for database, CDN for floor plan images, horizontal scaling of app servers, background job queue for CSV exports, audit logging |

### Scaling Priorities

1. **First bottleneck: Concurrent database writes**
   - SQLite struggles with concurrent writes (5-10 simultaneous users)
   - **Fix:** Migrate to PostgreSQL using repository abstraction layer
   - **When:** Moving from single-user to multi-user deployment

2. **Second bottleneck: Floor plan image storage**
   - Local filesystem doesn't scale across multiple app servers
   - Large images consume bandwidth when served directly
   - **Fix:** Migrate to cloud object storage (S3, Azure Blob, Google Cloud Storage) using IFileStorageRepository abstraction
   - **When:** Deploying to cloud or running multiple app servers

3. **Third bottleneck: CSV export with large datasets**
   - Synchronous export of 10,000+ assets blocks UI
   - **Fix:** Background job queue (Bull/BullMQ with Redis), export to cloud storage with download link
   - **When:** Users report slow exports (>5 seconds)

## Anti-Patterns

### Anti-Pattern 1: Storing Absolute Pixel Coordinates

**What people do:** Store marker positions as absolute pixel coordinates based on the original image resolution

**Why it's wrong:**
- Breaks when floor plan image is resized or re-exported at different resolution
- Doesn't work across different screen sizes/zoom levels
- Requires migration if image dimensions change

**Do this instead:** Use normalized coordinates (0.0 to 1.0) and convert to pixels during rendering based on current image dimensions

### Anti-Pattern 2: Coupling Business Logic to Database Implementation

**What people do:** Write service layer code that directly uses SQLite/PostgreSQL-specific features (e.g., `db.run()`, `pool.query()`)

**Why it's wrong:**
- Makes database migration painful and risky
- Tightly couples all business logic to database choice
- Makes testing difficult (can't mock database operations easily)
- SQLite uses `?` placeholders while PostgreSQL uses `$1`, breaking queries during migration

**Do this instead:** Define repository interfaces in domain layer, implement concrete repositories in infrastructure layer, inject repositories into services. See Repository Pattern example above.

### Anti-Pattern 3: Mixing Coordinate Systems

**What people do:** Store some coordinates in pixels, others in normalized form, calculate measurements using mixed systems

**Why it's wrong:**
- Creates confusion and bugs in coordinate transformations
- Measurement calculations become inconsistent
- Hard to validate data correctness
- Debugging coordinate issues becomes nightmare

**Do this instead:** Standardize on normalized coordinates (0.0 to 1.0) for all stored spatial data. Create dedicated CoordinateTransformService to handle all conversions. Document coordinate system in entity classes.

### Anti-Pattern 4: Embedding File Paths in Database

**What people do:** Store absolute file paths (e.g., `C:\Users\leroy\images\floor1.png`) directly in database

**Why it's wrong:**
- Breaks when application moves to different machine/server
- Doesn't work in cloud deployments
- Windows/Linux path differences cause portability issues
- Can't switch from local to cloud storage without data migration

**Do this instead:** Store relative paths or object keys, abstract file storage behind IFileStorageRepository interface. Repository implementation handles path resolution and storage location details.

**Example:**
```typescript
// WRONG: Absolute path in entity
class FloorPlan {
  imagePath: string = "C:\\Users\\leroy\\images\\floor1.png";
}

// RIGHT: Relative key, resolved by storage implementation
class FloorPlan {
  imageKey: string = "floorplans/floor1.png";  // Storage key, not path
}

interface IFileStorageRepository {
  getUrl(key: string): Promise<string>;  // Returns accessible URL
  save(key: string, data: Buffer): Promise<void>;
}

// Local implementation resolves to filesystem
class LocalFileStorage implements IFileStorageRepository {
  constructor(private basePath: string) {}
  async getUrl(key: string): Promise<string> {
    return `file://${path.join(this.basePath, key)}`;
  }
}

// Cloud implementation resolves to object storage URL
class CloudObjectStorage implements IFileStorageRepository {
  constructor(private s3Client: S3Client) {}
  async getUrl(key: string): Promise<string> {
    return this.s3Client.getSignedUrl(key);
  }
}
```

### Anti-Pattern 5: No Calibration Validation

**What people do:** Accept any two calibration points without checking if they're too close together or identical

**Why it's wrong:**
- Creates extreme scale factors that cause measurement errors
- Division by near-zero distances causes numerical instability
- User mistakes (clicking same point twice) aren't caught

**Do this instead:** Validate minimum pixel distance between calibration points, validate real-world distance is positive and reasonable, provide clear error messages.

**Example:**
```typescript
export class Calibration {
  private static MIN_PIXEL_DISTANCE = 50;  // Minimum 50 pixels apart
  private static MIN_REAL_DISTANCE = 0.1;   // Minimum 0.1 units

  constructor(
    point1: Point,
    point2: Point,
    realDistance: number,
    imageWidth: number,
    imageHeight: number
  ) {
    // Calculate pixel distance
    const dx = (point2.normalizedX - point1.normalizedX) * imageWidth;
    const dy = (point2.normalizedY - point1.normalizedY) * imageHeight;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    if (pixelDistance < Calibration.MIN_PIXEL_DISTANCE) {
      throw new Error(
        `Calibration points must be at least ${Calibration.MIN_PIXEL_DISTANCE} pixels apart`
      );
    }

    if (realDistance < Calibration.MIN_REAL_DISTANCE) {
      throw new Error(
        `Real-world distance must be at least ${Calibration.MIN_REAL_DISTANCE} units`
      );
    }

    // ... rest of constructor
  }
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Cloud Object Storage (S3, Azure Blob, GCS)** | Repository pattern via IFileStorageRepository | Use signed URLs for image access, implement retry logic for uploads, consider multipart upload for large files |
| **CSV Export Library** | Service layer dependency | Use streaming CSV writer for large datasets (e.g., `csv-writer` npm package) |
| **Image Processing** | Optional service for image optimization | Consider `sharp` library for server-side thumbnail generation, format conversion |
| **Authentication Provider** | Middleware/service injection | JWT tokens or session-based auth, inject user context into services for audit logging |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Presentation ↔ Application** | Service method calls, DTOs | UI components call service methods, services return DTOs (not domain entities). Prevents UI coupling to domain model. |
| **Application ↔ Domain** | Domain entities, validation | Services create/manipulate domain entities, entities enforce business rules through methods and validation. |
| **Application ↔ Infrastructure** | Repository interfaces | Services depend on repository interfaces (IAssetRepository), not implementations. Enables testing and database swapping. |
| **Infrastructure ↔ Database** | SQL queries, ORM | Repository implementations handle SQL or ORM calls. Domain layer never sees database-specific code. |
| **Infrastructure ↔ File Storage** | File I/O operations | IFileStorageRepository abstracts local filesystem vs cloud storage. Implementations handle storage-specific APIs. |

### Cross-Cutting Concerns

- **Logging:** Inject logger into services, log at repository layer for database operations, avoid logging in domain entities
- **Error Handling:** Domain entities throw validation errors, services catch and transform to user-friendly messages, presentation layer displays errors
- **Configuration:** Environment-based configuration for database connection, storage paths, inject via dependency injection
- **Testing:** Mock repository interfaces for unit testing services, use in-memory SQLite for integration tests, separate test data fixtures

## Build Order and Dependencies

### Phase 1: Foundation (Core Data Model)
**Build First:** Domain entities and basic infrastructure
- Define domain entities (Asset, FloorPlan, Marker, Location, Calibration)
- Create repository interfaces (IAssetRepository, IFloorPlanRepository, etc.)
- Implement SQLite repositories
- Set up database migrations
- Create basic file storage (local filesystem)

**Why First:** Everything depends on data model. Repositories needed for all features.

### Phase 2: Asset Management (Traditional CRUD)
**Build Second:** Asset CRUD without spatial features
- Asset service layer
- Asset UI components (list, form, search)
- Location hierarchy management
- CSV export functionality

**Why Second:** Delivers immediate value, tests repository layer, establishes UI patterns before adding complex floor plan features.

### Phase 3: Floor Plan Viewer (Read-Only Spatial)
**Build Third:** Display floor plans and existing markers
- Floor plan upload and storage
- Image viewer component (zoom, pan)
- CoordinateTransformService
- Display markers on floor plans (read-only)

**Why Third:** Visual feedback for spatial system. Tests normalized coordinate system before adding editing.

### Phase 4: Marker Management (Spatial Editing)
**Build Fourth:** Interactive marker placement and editing
- Click-to-place marker functionality
- Marker CRUD operations
- Link markers to assets
- Marker editing/deletion UI

**Why Fourth:** Builds on viewer, adds interactivity. Core spatial feature complete.

### Phase 5: Calibration & Measurement
**Build Fifth:** Measurement tools with calibration
- Calibration tool (two-point calibration)
- MeasurementService
- Distance measurement UI
- Scale display on floor plans

**Why Fifth:** Requires working marker system. Nice-to-have feature, not blocking other work.

### Phase 6: Multi-User & Migration Preparation
**Build Last:** PostgreSQL support and cloud storage
- PostgreSQL repository implementations
- Cloud object storage implementation (IFileStorageRepository)
- Database migration scripts
- User authentication (if needed)

**Why Last:** Only needed when scaling beyond single user. Repository abstraction makes this straightforward when needed.

## Sources

This architecture research draws from industry patterns and existing systems:

### Asset Management & Spatial Systems
- [Archilogic - System of Record for Floor Plans](https://www.archilogic.com/)
- [Smplrspace - Interactive Digital Floor Plans](https://www.smplrspace.com/digital-floor-plans)
- [Prevu3D - Visual Asset Management](https://www.prevu3d.com/solutions/reality-plan/visual-asset-management/)
- [Apiko - Interactive Floor Plans and Asset Mapping](https://apiko.com/blog/construction-management-interactive-floor-plans-asset-mapping-software/)
- [IBM Maximo Spatial Asset Management](https://www.ibm.com/docs/en/msam/7.6.1?topic=product-overview)
- [Asset Infinity - Integrated Facilities Management](https://www.assetinfinity.com/add-ons/floor-plan)

### Coordinate Systems & Indoor Mapping
- [Mappedin - Indoor Mapping for Asset Tracking](https://www.mappedin.com/resources/blog/indoor-mapping-use-case-asset-tracking/)
- [Geospatial World - Floor Plans to Asset Management](https://geospatialworld.net/article/from-floor-plans-to-asset-management/)
- [Archilogic Floor Plan SDK Guide](https://developers.archilogic.com/floor-plan-engine/guide)
- [Esri - Building Indoor GIS with Reality Capture](https://www.esri.com/arcgis-blog/products/arcgis-indoors/indoor-gis/building-an-indoor-gis-using-reality-capture)

### Coordinate Transformation Patterns
- [Scratchapixel - Computing Pixel Coordinates](https://www.scratchapixel.com/lessons/3d-basic-rendering/computing-pixel-coordinates-of-3d-point/mathematics-computing-2d-coordinates-of-3d-points.html)
- [ZBigatron - Mapping Camera Coordinates to 2D Floor Plan](https://zbigatron.com/mapping-camera-coordinates-to-a-2d-floor-plan/)
- [Kreo - Floor Plan Recognition Technologies](https://www.kreo.net/news-2d-takeoff/floor-plan-recognition-technologies)

### Calibration & Measurement
- [SmartDraw - Measure and Draw Floor Plans to Scale](https://www.smartdraw.com/floor-plan/measure-draw-floor-plan-scale.htm)
- [Plan7Architect - Digitize Floor Plans with 3D CAD](https://plan7architect.com/how-to-digitize-floor-plans-with-3d-cad-software-ai1/)
- [Cedreo - Measure and Draw Floor Plans to Scale](https://cedreo.com/floor-plans/measure-draw-floor-plans-to-scale/)

### Repository Pattern & Clean Architecture
- [Medium - Building Layered Architecture in NestJS & TypeScript](https://medium.com/@patrick.cunha336/building-a-layered-architecture-in-nestjs-typescript-repository-pattern-dtos-and-validators-08907a8ac4cb)
- [GitHub - TypeScript Clean Architecture by bypepe77](https://github.com/bypepe77/typescript-clean-architecture)
- [DEV Community - Clean Architecture and Unit of Work Pattern in Node.js](https://dev.to/schead/using-clean-architecture-and-the-unit-of-work-pattern-on-a-nodejs-application-3pc9)
- [Goca Blog - Mastering Repository Pattern in Clean Architecture](https://sazardev.github.io/goca/blog/articles/mastering-repository-pattern)

### Database Migration Patterns
- [Render - Migrate from SQLite to PostgreSQL](https://render.com/articles/how-to-migrate-from-sqlite-to-postgresql)
- [Mastering Postgres - Migrating from SQLite to PostgreSQL](https://masteringpostgres.com/articles/migrating-from-sqlite-to-postgresql)
- [Bytebase - Database Migration SQLite to PostgreSQL](https://www.bytebase.com/blog/database-migration-sqlite-to-postgresql/)
- [pgloader Documentation - SQLite to Postgres](https://pgloader.readthedocs.io/en/latest/ref/sqlite.html)

### Cloud Storage Architecture
- [Google Cloud - Product Overview of Cloud Storage](https://docs.cloud.google.com/storage/docs/introduction)
- [Google Cloud - What is Object Storage](https://cloud.google.com/learn/what-is-object-storage)
- [Computer Weekly - Cloud Storage 101: File, Block and Object Storage](https://www.computerweekly.com/feature/Cloud-storage-101-File-block-and-object-storage-in-the-cloud)
- [RealScale - Cloud Storage Scaling Strategies](https://realscale.cloud66.com/cloud-storage-scaling-strategies/)
- [System Design School - File Storage Systems Guide](https://systemdesignschool.io/blog/file-storage-system)

---
*Architecture research for: Visual Asset Mapper with Floor Plan Visualization*
*Researched: 2026-01-28*
*Confidence: HIGH - Based on industry patterns from established asset management and indoor mapping systems*
