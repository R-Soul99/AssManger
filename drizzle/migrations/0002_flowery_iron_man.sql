PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`tag` text NOT NULL,
	`description` text NOT NULL,
	`location_id` text NOT NULL,
	`category_id` integer,
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
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_assets`("id", "tag", "description", "location_id", "category_id", "serial_number", "phone_extension", "status", "owner", "cost_centre", "notes", "cost", "purchase_date", "created_at", "updated_at") SELECT "id", "tag", "description", "location_id", "category_id", "serial_number", "phone_extension", "status", "owner", "cost_centre", "notes", "cost", "purchase_date", "created_at", "updated_at" FROM `assets`;--> statement-breakpoint
DROP TABLE `assets`;--> statement-breakpoint
ALTER TABLE `__new_assets` RENAME TO `assets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `assets_tag_idx` ON `assets` (`tag`);--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`parent_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "parent_id", "created_at", "updated_at") SELECT "id", "name", "parent_id", "created_at", "updated_at" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;