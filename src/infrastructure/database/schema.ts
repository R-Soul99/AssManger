import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Locations table (hierarchical: site -> building -> floor -> room)
export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['site', 'building', 'floor', 'room'] }).notNull(),
  parentId: text('parent_id').references((): any => locations.id, { onDelete: 'cascade' }),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Assets table
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  tag: text('tag').notNull(),
  description: text('description').notNull(),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'restrict' }),
  assetTypeId: text('asset_type_id').references(() => assetTypes.id, { onDelete: 'restrict' }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'restrict' }), // DEPRECATED - will be removed after migration
  serialNumber: text('serial_number'),
  phoneExtension: text('phone_extension'),
  status: text('status', { enum: ['active', 'pending', 'decommissioned', 'faulty', 'maintenance'] }).notNull().default('active'),
  owner: text('owner'),
  costCentre: text('cost_centre'),
  notes: text('notes'),
  cost: real('cost'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  tagIdx: uniqueIndex('assets_tag_idx').on(table.tag),
}));

// Floor plans table
export const floorPlans = sqliteTable('floor_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  locationId: text('location_id').references(() => locations.id, { onDelete: 'set null' }),
  imageRelativePath: text('image_relative_path').notNull(),
  imageWidth: integer('image_width').notNull(),
  imageHeight: integer('image_height').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Markers table (normalized coordinates 0.0-1.0)
export const markers = sqliteTable('markers', {
  id: text('id').primaryKey(),
  floorPlanId: text('floor_plan_id').notNull().references(() => floorPlans.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  normalizedX: real('normalized_x').notNull(), // 0.0 to 1.0
  normalizedY: real('normalized_y').notNull(), // 0.0 to 1.0
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Calibrations table (two-point calibration data)
export const calibrations = sqliteTable('calibrations', {
  id: text('id').primaryKey(),
  floorPlanId: text('floor_plan_id').notNull().references(() => floorPlans.id, { onDelete: 'cascade' }),
  // Calibration points (normalized coordinates)
  point1X: real('point1_x').notNull(),
  point1Y: real('point1_y').notNull(),
  point2X: real('point2_x').notNull(),
  point2Y: real('point2_y').notNull(),
  // Known distance and units
  realWorldDistance: real('real_world_distance').notNull(),
  units: text('units', { enum: ['metres', 'feet'] }).notNull(),
  // Calculated scale
  scale: real('scale').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Room Zones table (spatial entity for room boundaries)
export const roomZones = sqliteTable('room_zones', {
  id: text('id').primaryKey(),
  floorPlanId: text('floor_plan_id').notNull().references(() => floorPlans.id, { onDelete: 'cascade' }),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'restrict' }),
  normalizedX: real('normalized_x').notNull(), // 0.0 to 1.0
  normalizedY: real('normalized_y').notNull(), // 0.0 to 1.0
  normalizedWidth: real('normalized_width').notNull(), // 0.0 to 1.0
  normalizedHeight: real('normalized_height').notNull(), // 0.0 to 1.0
  color: text('color').notNull(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Furniture table (spatial entity for furniture placement)
export const furniture = sqliteTable('furniture', {
  id: text('id').primaryKey(),
  floorPlanId: text('floor_plan_id').notNull().references(() => floorPlans.id, { onDelete: 'cascade' }),
  roomZoneId: text('room_zone_id').notNull().references(() => roomZones.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['desk', 'bench', 'custom'] }).notNull(),
  normalizedX: real('normalized_x').notNull(), // 0.0 to 1.0 (center point)
  normalizedY: real('normalized_y').notNull(), // 0.0 to 1.0 (center point)
  normalizedWidth: real('normalized_width').notNull(), // 0.0 to 1.0
  normalizedHeight: real('normalized_height').notNull(), // 0.0 to 1.0
  rotation: real('rotation').notNull().default(0), // degrees 0-360
  customFields: text('custom_fields'), // JSON stored as text
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Infrastructure table (spatial entity for infrastructure points)
export const infrastructure = sqliteTable('infrastructure', {
  id: text('id').primaryKey(),
  floorPlanId: text('floor_plan_id').notNull().references(() => floorPlans.id, { onDelete: 'cascade' }),
  roomZoneId: text('room_zone_id').notNull().references(() => roomZones.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['power_outlet', 'network_port'] }).notNull(),
  normalizedX: real('normalized_x').notNull(), // 0.0 to 1.0 (point location)
  normalizedY: real('normalized_y').notNull(), // 0.0 to 1.0 (point location)
  customFields: text('custom_fields'), // JSON stored as text
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Relations (for Drizzle query builder)
export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: 'locationHierarchy',
  }),
  children: many(locations, { relationName: 'locationHierarchy' }),
  assets: many(assets),
  floorPlans: many(floorPlans),
  roomZones: many(roomZones),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  location: one(locations, {
    fields: [assets.locationId],
    references: [locations.id],
  }),
  assetType: one(assetTypes, {
    fields: [assets.assetTypeId],
    references: [assetTypes.id],
  }),
  category: one(categories, {
    fields: [assets.categoryId],
    references: [categories.id],
  }), // DEPRECATED
  markers: many(markers),
}));

export const floorPlansRelations = relations(floorPlans, ({ one, many }) => ({
  location: one(locations, {
    fields: [floorPlans.locationId],
    references: [locations.id],
  }),
  markers: many(markers),
  calibration: one(calibrations),
  roomZones: many(roomZones),
  furniture: many(furniture),
  infrastructure: many(infrastructure),
}));

export const markersRelations = relations(markers, ({ one }) => ({
  floorPlan: one(floorPlans, {
    fields: [markers.floorPlanId],
    references: [floorPlans.id],
  }),
  asset: one(assets, {
    fields: [markers.assetId],
    references: [assets.id],
  }),
}));

export const calibrationsRelations = relations(calibrations, ({ one }) => ({
  floorPlan: one(floorPlans, {
    fields: [calibrations.floorPlanId],
    references: [floorPlans.id],
  }),
}));

// Asset Types table (replaces categories)
export const assetTypes = sqliteTable('asset_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  icon: text('icon').notNull().default('FaBox'),
  color: text('color').notNull().default('#000000'),
  isSystemType: integer('is_system_type', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Custom Field Definitions table
export const customFieldDefinitions = sqliteTable('custom_field_definitions', {
  id: text('id').primaryKey(),
  assetTypeId: text('asset_type_id').notNull().references(() => assetTypes.id, { onDelete: 'cascade' }),
  fieldName: text('field_name').notNull(),
  fieldType: text('field_type', { enum: ['text', 'number', 'date', 'dropdown', 'checkbox', 'link'] }).notNull(),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  dropdownOptions: text('dropdown_options'), // JSON array stored as text
  defaultValue: text('default_value'), // JSON-encoded value
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueFieldName: uniqueIndex('custom_field_definitions_unique_field_name').on(table.assetTypeId, table.fieldName),
}));

// Categories table (hierarchical) - DEPRECATED, will be removed in migration
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  parentId: integer('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
  description: text('description'),
  icon: text('icon').notNull().default('FaBox'),
  color: text('color').notNull().default('#000000'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Relations for Asset Types
export const assetTypesRelations = relations(assetTypes, ({ many }) => ({
  assets: many(assets),
  customFieldDefinitions: many(customFieldDefinitions),
}));

// Relations for Custom Field Definitions
export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ one }) => ({
  assetType: one(assetTypes, {
    fields: [customFieldDefinitions.assetTypeId],
    references: [assetTypes.id],
  }),
}));

// Relations for Categories - DEPRECATED
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categoryHierarchy',
  }),
  children: many(categories, { relationName: 'categoryHierarchy' }),
  assets: many(assets),
}));

// Relations for Room Zones
export const roomZonesRelations = relations(roomZones, ({ one, many }) => ({
  floorPlan: one(floorPlans, {
    fields: [roomZones.floorPlanId],
    references: [floorPlans.id],
  }),
  location: one(locations, {
    fields: [roomZones.locationId],
    references: [locations.id],
  }),
  furniture: many(furniture),
  infrastructure: many(infrastructure),
}));

// Relations for Furniture
export const furnitureRelations = relations(furniture, ({ one }) => ({
  floorPlan: one(floorPlans, {
    fields: [furniture.floorPlanId],
    references: [floorPlans.id],
  }),
  roomZone: one(roomZones, {
    fields: [furniture.roomZoneId],
    references: [roomZones.id],
  }),
}));

// Relations for Infrastructure
export const infrastructureRelations = relations(infrastructure, ({ one }) => ({
  floorPlan: one(floorPlans, {
    fields: [infrastructure.floorPlanId],
    references: [floorPlans.id],
  }),
  roomZone: one(roomZones, {
    fields: [infrastructure.roomZoneId],
    references: [roomZones.id],
  }),
}));
