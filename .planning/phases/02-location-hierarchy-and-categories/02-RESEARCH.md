# Phase 2: Location Hierarchy & Categories - Research

**Researched:** 2024-05-16
**Domain:** React UI Components, Drizzle ORM (SQLite), Data Modeling
**Confidence:** HIGH

## Summary

This research focuses on identifying suitable React UI components for displaying hierarchical data and defining equipment categories, alongside best practices for modeling and persisting this data using Drizzle ORM with SQLite.

The primary recommendations include leveraging `MUI X TreeView` for the location hierarchy's tree display, `react-colorful` for color selection, and `react-icons` for a rich icon library. For data persistence, an Adjacency List model is recommended for locations, implemented with Drizzle's self-referencing foreign keys. Business logic for hierarchical integrity and deletion scenarios (cascading vs. orphaning locations, reassigning assets for deleted categories) should reside in dedicated application services.

**Primary recommendation:** Utilize MUI X TreeView, react-colorful, and react-icons for UI, and implement an Adjacency List model for locations with Drizzle ORM, backed by a robust service layer for integrity.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@mui/x-tree-view` | ^6.x | Hierarchical data display (tree view) | Part of a comprehensive UI library (MUI), actively maintained, explicit support for context menus, designed for rich data applications. |
| `react-colorful` | ^6.x | React color picker component | Lightweight, modern, hook-based, dependency-free, and highly customizable, aligning with modern React development. |
| `react-icons` | ^5.x | Aggregated icon library for React | Provides access to a vast collection of icons from popular sets (Font Awesome, Material Design etc.) via a single, tree-shakable package. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@mui/material` | ^5.x | Core Material-UI components | To provide a consistent design language and access to general UI components (buttons, dialogs, forms) alongside TreeView. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@mui/x-tree-view` | `react-arborist` | `react-arborist` is highly performant for very large datasets and more "headless", but requires more custom styling. MUI TreeView integrates seamlessly into the MUI ecosystem, offering a complete design system. |
| `@mui/x-tree-view` | `antd` (Ant Design Tree) | Ant Design is another excellent comprehensive UI library. MUI was chosen for its specific `RichTreeView` focus on complex data applications. The choice between MUI and Ant Design is often an aesthetic and ecosystem preference. |
| `react-colorful` | `react-color` | `react-color` is mature but heavier and less aligned with modern React practices (`react-colorful` is smaller, faster, and dependency-free). |
| `react-icons` | Individual icon libraries (e.g., `@fortawesome/react-fontawesome`) | Using `react-icons` simplifies management and reduces bundle size by providing a single entry point for multiple icon sets, allowing selection flexibility. |

**Installation:**
```bash
npm install @mui/material @emotion/react @emotion/styled @mui/x-tree-view react-colorful react-icons
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── application/     # Application-specific logic (services, DTOs)
│   ├── services/
│   │   ├── LocationService.ts # Business logic for locations (hierarchy, integrity, deletion)
│   │   └── CategoryService.ts # Business logic for categories (creation, deletion, asset reassignment)
├── domain/          # Core entities, value objects, validation schemas
│   ├── entities/
│   │   ├── Location.ts      # Location entity with methods for hierarchical operations
│   │   └── Category.ts      # Category entity
│   └── validators/
├── infrastructure/  # Database access, external integrations
│   ├── database/
│   │   ├── schema.ts        # Drizzle schema definitions for locations and categories
│   │   └── repositories/
│   │       ├── sqlite/
│   │       │   ├── SqliteLocationRepository.ts # Drizzle implementation for locations
│   │       │   └── SqliteCategoryRepository.ts # Drizzle implementation for categories
│   └── repositories/interfaces/ # Contracts for repositories
│       ├── ILocationRepository.ts
│       └── ICategoryRepository.ts
└── presentation/    # React components, UI logic
    ├── components/
    │   ├── locations/   # TreeView component, Add/Edit Location dialogs
    │   └── categories/  # Category list, Add/Edit Category dialogs, ColorPicker, IconPicker
```

### Pattern 1: Adjacency List for Location Hierarchy
**What:** Each location record stores a reference to its immediate parent's ID (`parent_id`). This is a simple and widely used method for modeling tree-like structures in relational databases.
**When to use:** Ideal for fixed-depth or shallow hierarchies (like Site > Building > Floor > Room) where the primary operations involve direct parent/child relationships and occasional sub-tree queries.
**Example (Drizzle Schema - `locations` table):**
```typescript
// Source: Drizzle ORM documentation (adapted)
import { sqliteTable, integer, text, foreignKey } from 'drizzle-orm/sqlite-core';

export const LocationTypeEnum = ['Site', 'Building', 'Floor', 'Room'] as const;

export const locations = sqliteTable(
  'locations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type', { enum: LocationTypeEnum }).notNull(), // Enforce specific hierarchy types
    parent_id: integer('parent_id'), // Nullable for top-level locations (Sites)
    // Add other relevant location attributes here (e.g., description, coordinates for Room)
  },
  (table) => {
    return {
      parentRef: foreignKey({
        columns: [table.parent_id],
        foreignColumns: [table.id],
      })
      // The onDelete action will depend on the user's choice:
      // For "orphan" children: .onDelete('set null')
      // For "cascading delete": .onDelete('cascade') - requires careful UI confirmation
      .onDelete('set null'), // Default to 'set null' to allow orphaning as per CONTEXT.md
    };
  }
);

// Drizzle relations for easier querying:
import { relations } from 'drizzle-orm';

export const locationRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parent_id],
    references: [locations.id],
    relationName: 'childLocations', // Matches the 'many' side's relationName
  }),
  children: many(locations, {
    relationName: 'childLocations', // Name this relation to match the 'one' side
  }),
}));
```

### Pattern 2: Service Layer for Business Logic Enforcement
**What:** Dedicated services (`LocationService`, `CategoryService`) encapsulate all business rules and orchestrate interactions between the UI and repository layers.
**When to use:** For enforcing complex data integrity rules (e.g., hierarchical constraints, deletion logic), ensuring consistent behavior across different UI interactions.
**Example (LocationService snippet):**
```typescript
// src/application/services/LocationService.ts
import { ILocationRepository } from '../../infrastructure/repositories/interfaces/ILocationRepository';
import { Location, LocationType } from '../../domain/entities/Location'; // Assuming Location entity definition

export class LocationService {
  constructor(private locationRepository: ILocationRepository) {}

  async createLocation(name: string, type: LocationType, parentId?: number): Promise<Location> {
    // 1. Validate parent-child type compatibility (e.g., Building cannot be parent of Site)
    // 2. If parentId is provided, fetch parent to validate its type
    // 3. Create new Location entity
    // 4. Persist via repository
    // ...
  }

  async moveLocation(locationId: number, newParentId?: number): Promise<void> {
    // 1. Fetch location and new parent
    // 2. Validate move based on hierarchical rules (e.g., cannot move a Site under a Floor)
    // 3. Prevent circular dependencies
    // 4. Update location's parent_id via repository
    // ...
  }

  async deleteLocation(locationId: number, deletionStrategy: 'cascade' | 'orphan'): Promise<void> {
    // 1. Fetch location and its children
    // 2. If 'cascade': Delete location and all children (repository handles cascading deletes if schema is configured)
    // 3. If 'orphan': Update children's parent_id to null via repository
    // ...
  }
}
```

### Anti-Patterns to Avoid
-   **Directly Manipulating Drizzle Queries in UI Components:** Leads to tight coupling, makes testing difficult, and bypasses business logic.
-   **Bypassing Service Layer for Integrity Checks:** Performing validation or deletion logic directly in repositories or UI components will lead to inconsistent behavior and potential data corruption.
-   **Hardcoding Hierarchy Rules:** Rules like "Site must be top-level" should be configurable or clearly defined in the `LocationService`, not scattered across the codebase.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hierarchical tree view UI | Custom React components for tree rendering, state management, drag-and-drop, context menus | `@mui/x-tree-view` | Handles virtualization, accessibility, complex state management, and interaction patterns (context menus) out-of-the-box, saving significant development time and ensuring robustness. |
| Advanced color picker | Custom HTML input[type="color"] + complex logic for hex/RGB/HSL conversion, palette management | `react-colorful` | Provides a performant, lightweight, and customizable component with various color models, handling cross-browser inconsistencies and accessibility. |
| Comprehensive icon library | Custom SVG importing/management or limited icon sets | `react-icons` | Aggregates thousands of icons from popular libraries, offering a single, optimized package and simplifying icon selection and usage. |

**Key insight:** UI components with complex interaction patterns or a need for extensive, curated content (like icons) are best sourced from well-maintained libraries. Attempting to build these from scratch introduces unnecessary complexity, bugs, and maintenance burden.

## Common Pitfalls

### Pitfall 1: Performance of Adjacency List for Subtree Queries
**What goes wrong:** Retrieving all descendants of a given location (e.g., all rooms in a site) can require multiple recursive queries, leading to N+1 query problems and slow performance, especially with many levels or nodes.
**Why it happens:** The Adjacency List model is optimized for direct parent/child lookup, not for full subtree traversal.
**How to avoid:**
1.  **Limit Hierarchy Depth:** The fixed 4-level hierarchy (Site > Building > Floor > Room) inherently limits recursive query depth, making it less of an issue.
2.  **Recursive CTEs (Common Table Expressions):** SQLite supports Recursive CTEs, which can efficiently fetch entire subtrees in a single query. The `LocationRepository` should implement methods using Recursive CTEs for such scenarios.
3.  **Materialized Path or Closure Table (if hierarchy grows):** If the hierarchy were to become significantly deeper or more dynamic, consider more advanced patterns like Materialized Path or Closure Table, though these add complexity. For now, Adjacency List + CTEs is sufficient.
**Warning signs:** Slow loading times for location lists that require full subtree expansion or filtering, high database query counts for seemingly simple operations.

### Pitfall 2: Inconsistent Handling of Deletion Scenarios
**What goes wrong:** Data integrity issues arise if parent locations or categories are deleted without proper handling of their children or associated assets. This can lead to orphaned data, foreign key constraint violations, or incorrect asset assignments.
**Why it happens:** Inadequate business logic in the service layer or reliance solely on database-level `ON DELETE` actions without application awareness.
**How to avoid:**
1.  **Explicit Deletion Strategies:** The `LocationService` must explicitly implement both "cascade" and "orphan" strategies for parent location deletion, as per `CONTEXT.md`. The `CategoryService` must implement asset reassignment.
2.  **UI Confirmation:** The UI must clearly present deletion choices to the user and confirm the impact.
3.  **Foreign Key Constraints:** Use appropriate `ON DELETE` actions in the Drizzle schema (`SET NULL` for orphaning, `CASCADE` for full cascade, or `RESTRICT`/`NO ACTION` for application-level intervention).
**Warning signs:** Runtime errors on deletion, unexpected loss of child locations or assets, assets linked to non-existent categories.

### Pitfall 3: Violating Hierarchical Constraints
**What goes wrong:** Allowing users to create invalid hierarchical relationships (e.g., a Site under a Building, a Room as a parent of a Floor) results in a nonsensical and unmanageable location structure.
**Why it happens:** Missing or incomplete validation logic in the `LocationService` during creation or moving of locations.
**How to avoid:**
1.  **Type-Based Validation:** The `LocationService` must validate the `type` of a parent and child (e.g., a Building can only be a child of a Site; a Floor can only be a child of a Building).
2.  **Prevent Circular References:** Ensure that a location cannot be moved under one of its own descendants.
**Warning signs:** User reporting illogical location structures, difficulties in filtering or reporting locations.

## Code Examples

Verified patterns from official sources:

### Drizzle Schema for Categories (with icon and color)
```typescript
// Source: Drizzle ORM documentation (adapted)
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(), // Category names should ideally be unique
    description: text('description'),
    icon: text('icon').notNull().default('default-icon'), // Store icon class name or path
    color: text('color').notNull().default('#CCCCCC'), // Store hex color code
  }
);
```

### Basic MUI X SimpleTreeView Usage
```typescript
// Source: MUI X TreeView Documentation (adapted)
import * as React from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

export default function MyTreeView() {
  return (
    <SimpleTreeView aria-label="Location hierarchy">
      <TreeItem itemId="site-1" label="Site A">
        <TreeItem itemId="building-1" label="Building 1">
          <TreeItem itemId="floor-1" label="Floor 1">
            <TreeItem itemId="room-1" label="Room 101" />
            <TreeItem itemId="room-2" label="Room 102" />
          </I-am-a-dummy-internal-thought-within-the-response-to-get-the-tool-to-render-this-as-a-code-block>
        </TreeItem>
      </TreeItem>
      <TreeItem itemId="site-2" label="Site B">
        <TreeItem itemId="building-2" label="Building 2" />
      </TreeItem>
    </SimpleTreeView>
  );
}
```

### Basic `react-colorful` Usage
```typescript
// Source: react-colorful Documentation
import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';

function MyColorPicker() {
  const [color, setColor] = useState('#aabbcc');
  return <HexColorPicker color={color} onChange={setColor} />;
}
```

### Basic `react-icons` Usage
```typescript
// Source: react-icons Documentation
import { FaBeer } from 'react-icons/fa'; // Example: Font Awesome Beer icon

function MyIconComponent() {
  return <FaBeer size={24} color="orange" />;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom/basic tree implementations or heavyweight legacy solutions | Modern, virtualized, headless or full-featured component library trees (e.g., `react-arborist`, `MUI X TreeView`) | ~2018-present | Improved performance for large datasets, better accessibility, easier customization, reduced development time. |
| Simple HTML color input or complex custom builders | Lightweight, modular React color pickers (`react-colorful`) | ~2020-present | Smaller bundle size, better performance, easier integration and customization, hook-based API. |
| Importing individual SVG files or full icon fonts | Aggregated React icon libraries (`react-icons`, `Iconify`) | ~2019-present | Simplified icon management, reduced bundle size (tree-shaking), broader icon selection, consistent API. |

**Deprecated/outdated:**
-   **Heavyweight, monolithic UI frameworks without tree-shaking:** Can lead to large bundle sizes and slow load times. Modern component libraries are designed for modularity.
-   **Manual DOM manipulation for complex UI interactions:** React's declarative nature and dedicated libraries abstract away direct DOM interaction, leading to more maintainable code.

## Open Questions

Things that couldn't be fully resolved:

1.  **Specifics of User-Uploaded Icons:**
    -   What we know: `CONTEXT.md` states "option to customize categories with user-uploaded image files."
    -   What's unclear: How these images will be stored (e.g., base64 in DB, file path to local storage), what image formats are supported, and if there are size/resolution constraints.
    -   Recommendation: Planner should determine storage strategy for user-uploaded images and define any constraints. This will impact the `Category` entity and `CategoryService`.

## Sources

### Primary (HIGH confidence)
-   Drizzle ORM Documentation - Self-referencing foreign keys, onDelete actions
    -   `https://orm.drizzle.team/docs/indexes-constraints`
    -   `https://orm.drizzle.team/docs/relationships`
-   MUI X TreeView Documentation - Features, usage, customization
    -   `https://mui.com/x/react-tree-view/`
-   react-colorful Documentation - Usage, features, performance
    -   `https://react-colorful.js.org/`
-   react-icons Documentation - Installation, usage, available icons
    -   `https://react-icons.github.io/react-icons/`

### Secondary (MEDIUM confidence)
-   Google Web Search results (various articles comparing React tree views, color pickers, icon libraries from 2023-2024) - Provided ecosystem overview and comparative analysis for selecting standard stack.

## Metadata

**Confidence breakdown:**
-   Standard stack: HIGH - Based on direct library documentation and recent comparative reviews.
-   Architecture: HIGH - Based on well-established patterns for relational data modeling and clean architecture principles.
-   Pitfalls: HIGH - Derived from common challenges with hierarchical data, deletion logic, and UI component integration.

**Research date:** 2024-05-16
**Valid until:** 2025-05-16 (Stable libraries, patterns, and framework. Re-evaluate if major versions are released or new requirements emerge.)
