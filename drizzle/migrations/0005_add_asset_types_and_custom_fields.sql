-- Migration: Add asset_types and custom_field_definitions tables, migrate from categories
PRAGMA foreign_keys=OFF;

-- Create asset_types table
CREATE TABLE `asset_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL UNIQUE,
	`description` text,
	`icon` text DEFAULT 'FaBox' NOT NULL,
	`color` text DEFAULT '#000000' NOT NULL,
	`is_system_type` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

-- Create custom_field_definitions table
CREATE TABLE `custom_field_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_type_id` text NOT NULL,
	`field_name` text NOT NULL,
	`field_type` text NOT NULL CHECK (`field_type` IN ('text', 'number', 'date', 'dropdown', 'checkbox', 'link')),
	`required` integer DEFAULT 0 NOT NULL,
	`dropdown_options` text,
	`default_value` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`asset_type_id`) REFERENCES `asset_types`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Create unique index for custom field definitions
CREATE UNIQUE INDEX `custom_field_definitions_unique_field_name` ON `custom_field_definitions` (`asset_type_id`, `field_name`);

-- Migrate data from categories to asset_types
INSERT INTO `asset_types` (`id`, `name`, `description`, `icon`, `color`, `is_system_type`, `created_at`, `updated_at`)
SELECT
	'asset_type_' || `id`,
	`name`,
	`description`,
	`icon`,
	`color`,
	0,
	`created_at`,
	`updated_at`
FROM `categories`
WHERE `parent_id` IS NULL;  -- Only migrate top-level categories

-- Seed system asset types if not already present from migration
INSERT OR IGNORE INTO `asset_types` (`id`, `name`, `description`, `icon`, `color`, `is_system_type`, `created_at`, `updated_at`)
VALUES
	('system_pc', 'PC', 'Personal Computer', 'FaDesktop', '#3498db', 1, strftime('%s', 'now'), strftime('%s', 'now')),
	('system_phone', 'Phone', 'Telephone', 'FaPhone', '#2ecc71', 1, strftime('%s', 'now'), strftime('%s', 'now')),
	('system_printer', 'Printer', 'Printer', 'FaPrint', '#9b59b6', 1, strftime('%s', 'now'), strftime('%s', 'now')),
	('system_monitor', 'Monitor', 'Display Monitor', 'FaDesktop', '#e74c3c', 1, strftime('%s', 'now'), strftime('%s', 'now')),
	('system_electronics', 'Electronics', 'Electronic Equipment', 'FaMicrochip', '#f39c12', 1, strftime('%s', 'now'), strftime('%s', 'now')),
	('system_machinery', 'Machinery', 'Machinery and Equipment', 'FaCog', '#34495e', 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- Create new assets table with asset_type_id
CREATE TABLE `__new_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`tag` text NOT NULL,
	`description` text NOT NULL,
	`location_id` text NOT NULL,
	`asset_type_id` text,
	`serial_number` text,
	`phone_extension` text,
	`status` text DEFAULT 'active' NOT NULL CHECK (`status` IN ('active', 'pending', 'decommissioned', 'faulty', 'maintenance')),
	`owner` text,
	`cost_centre` text,
	`notes` text,
	`cost` real,
	`purchase_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`asset_type_id`) REFERENCES `asset_types`(`id`) ON UPDATE no action ON DELETE restrict
);

-- Migrate assets data, mapping category_id to asset_type_id
INSERT INTO `__new_assets` (
	`id`, `tag`, `description`, `location_id`, `asset_type_id`,
	`serial_number`, `phone_extension`, `status`, `owner`, `cost_centre`,
	`notes`, `cost`, `purchase_date`, `created_at`, `updated_at`
)
SELECT
	a.`id`, a.`tag`, a.`description`, a.`location_id`,
	CASE
		WHEN a.`category_id` IS NOT NULL THEN 'asset_type_' || a.`category_id`
		ELSE NULL
	END,
	a.`serial_number`, a.`phone_extension`, a.`status`, a.`owner`, a.`cost_centre`,
	a.`notes`, a.`cost`, a.`purchase_date`, a.`created_at`, a.`updated_at`
FROM `assets` a;

-- Create unique index on tag
CREATE UNIQUE INDEX `assets_tag_idx` ON `__new_assets` (`tag`);

-- Replace old assets table
DROP TABLE `assets`;
ALTER TABLE `__new_assets` RENAME TO `assets`;

-- Drop categories table (no longer needed)
DROP TABLE IF EXISTS `categories`;

PRAGMA foreign_keys=ON;
