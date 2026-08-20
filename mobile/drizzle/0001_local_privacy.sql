CREATE TABLE `onboarding_drafts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`schema_version` integer NOT NULL,
	`step` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text NOT NULL,
	`quarantined` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_events` (
	`name` text PRIMARY KEY NOT NULL,
	`recorded_at` text NOT NULL
);
