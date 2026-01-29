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
  category: text('category').notNull(),
  description: text('description').notNull(),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'restrict' }),
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
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  imageRelativePath: text('image_relative_path').notNull(),
  imageWidth: integer('image_width').notNull(),
  imageHeight: integer('image_height').notNull(),
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
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  location: one(locations, {
    fields: [assets.locationId],
    references: [locations.id],
  }),
  markers: many(markers),
}));

export const floorPlansRelations = relations(floorPlans, ({ one, many }) => ({
  location: one(locations, {
    fields: [floorPlans.locationId],
    references: [locations.id],
  }),
  markers: many(markers),
  calibration: one(calibrations),
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
