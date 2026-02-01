import { z } from 'zod';

// Location types for hierarchy
export const LocationTypeSchema = z.enum(['site', 'building', 'floor', 'room']);
export type LocationType = z.infer<typeof LocationTypeSchema>;

// Location schema (hierarchy: site -> building -> floor -> room)
export const LocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  type: LocationTypeSchema,
  parentId: z.string().uuid().nullable(), // null for sites (top level)
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Asset schema - ALL required fields per CONTEXT.md
export const AssetSchema = z.object({
  id: z.string().uuid(),
  tag: z.string().min(1, "Asset tag is required"),
  categoryId: z.number(),
  description: z.string().min(1, "Description is required"),
  locationId: z.string().uuid("Location is required"),
  serialNumber: z.string().optional(),
  phoneExtension: z.string().optional(),
  status: z.enum(['active', 'pending', 'decommissioned', 'faulty', 'maintenance']).default('active'),
  owner: z.string().optional(),
  costCentre: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().positive().optional(),
  purchaseDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Normalized coordinate (0.0 to 1.0 range)
export const NormalizedCoordinateSchema = z.number()
  .min(0, "Coordinate must be >= 0")
  .max(1, "Coordinate must be <= 1");

// FloorPlan schema
export const FloorPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Floor plan name is required"),
  locationId: z.string().uuid("Location is required"), // building or floor
  imageRelativePath: z.string().min(1, "Image path is required"),
  imageWidth: z.number().int().positive("Image width must be positive"),
  imageHeight: z.number().int().positive("Image height must be positive"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Marker schema (links asset to floor plan location)
export const MarkerSchema = z.object({
  id: z.string().uuid(),
  floorPlanId: z.string().uuid("Floor plan is required"),
  assetId: z.string().uuid("Asset is required"),
  normalizedX: NormalizedCoordinateSchema,
  normalizedY: NormalizedCoordinateSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Calibration schema (two-point scale calibration)
export const CalibrationSchema = z.object({
  id: z.string().uuid(),
  floorPlanId: z.string().uuid("Floor plan is required"),
  // First calibration point (normalized coordinates)
  point1X: NormalizedCoordinateSchema,
  point1Y: NormalizedCoordinateSchema,
  // Second calibration point (normalized coordinates)
  point2X: NormalizedCoordinateSchema,
  point2Y: NormalizedCoordinateSchema,
  // Known real-world distance between points
  realWorldDistance: z.number().positive("Distance must be positive"),
  units: z.enum(['metres', 'feet']),
  // Calculated scale (units per normalized unit)
  scale: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Category schema (hierarchical)
export const CategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Category name is required"),
  parentId: z.number().int().positive().nullable().optional(),
  description: z.string().optional(),
  icon: z.string().default('FaBox'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code").default('#000000'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports
export type LocationData = z.infer<typeof LocationSchema>;
export type AssetData = z.infer<typeof AssetSchema>;
export type FloorPlanData = z.infer<typeof FloorPlanSchema>;
export type MarkerData = z.infer<typeof MarkerSchema>;
export type CalibrationData = z.infer<typeof CalibrationSchema>;
export type CategoryData = z.infer<typeof CategorySchema>;
