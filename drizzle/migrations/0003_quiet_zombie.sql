ALTER TABLE `categories` ADD `description` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `icon` text DEFAULT 'FaBox' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `color` text DEFAULT '#000000' NOT NULL;