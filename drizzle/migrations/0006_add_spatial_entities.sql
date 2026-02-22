-- Migration: Add room_zones, furniture, and infrastructure tables for spatial planning
PRAGMA foreign_keys=OFF;

-- Create room_zones table
CREATE TABLE `room_zones` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_plan_id` text NOT NULL,
	`location_id` text NOT NULL,
	`normalized_x` real NOT NULL,
	`normalized_y` real NOT NULL,
	`normalized_width` real NOT NULL,
	`normalized_height` real NOT NULL,
	`color` text NOT NULL,
	`name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `floor_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE restrict
);

-- Create furniture table
CREATE TABLE `furniture` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_plan_id` text NOT NULL,
	`room_zone_id` text NOT NULL,
	`type` text NOT NULL CHECK (`type` IN ('desk', 'bench', 'custom')),
	`normalized_x` real NOT NULL,
	`normalized_y` real NOT NULL,
	`normalized_width` real NOT NULL,
	`normalized_height` real NOT NULL,
	`rotation` real DEFAULT 0 NOT NULL,
	`custom_fields` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `floor_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_zone_id`) REFERENCES `room_zones`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Create infrastructure table
CREATE TABLE `infrastructure` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_plan_id` text NOT NULL,
	`room_zone_id` text NOT NULL,
	`type` text NOT NULL CHECK (`type` IN ('power_outlet', 'network_port')),
	`normalized_x` real NOT NULL,
	`normalized_y` real NOT NULL,
	`custom_fields` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `floor_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_zone_id`) REFERENCES `room_zones`(`id`) ON UPDATE no action ON DELETE cascade
);

PRAGMA foreign_keys=ON;
