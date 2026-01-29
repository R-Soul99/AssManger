CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`tag` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`location_id` text NOT NULL,
	`serial_number` text,
	`phone_extension` text,
	`status` text DEFAULT 'active' NOT NULL,
	`owner` text,
	`cost_centre` text,
	`notes` text,
	`cost` real,
	`purchase_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assets_tag_idx` ON `assets` (`tag`);--> statement-breakpoint
CREATE TABLE `calibrations` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_plan_id` text NOT NULL,
	`point1_x` real NOT NULL,
	`point1_y` real NOT NULL,
	`point2_x` real NOT NULL,
	`point2_y` real NOT NULL,
	`real_world_distance` real NOT NULL,
	`units` text NOT NULL,
	`scale` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `floor_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `floor_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`location_id` text NOT NULL,
	`image_relative_path` text NOT NULL,
	`image_width` integer NOT NULL,
	`image_height` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `markers` (
	`id` text PRIMARY KEY NOT NULL,
	`floor_plan_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`normalized_x` real NOT NULL,
	`normalized_y` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `floor_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
