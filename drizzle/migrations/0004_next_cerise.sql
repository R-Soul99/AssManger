PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_floor_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`location_id` text,
	`image_relative_path` text NOT NULL,
	`image_width` integer NOT NULL,
	`image_height` integer NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_floor_plans`("id", "name", "location_id", "image_relative_path", "image_width", "image_height", "display_order", "created_at", "updated_at") SELECT "id", "name", "location_id", "image_relative_path", "image_width", "image_height", "display_order", "created_at", "updated_at" FROM `floor_plans`;--> statement-breakpoint
DROP TABLE `floor_plans`;--> statement-breakpoint
ALTER TABLE `__new_floor_plans` RENAME TO `floor_plans`;--> statement-breakpoint
PRAGMA foreign_keys=ON;