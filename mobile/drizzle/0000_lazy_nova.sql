CREATE TABLE `foods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`serving_label` text NOT NULL,
	`serving_grams` real,
	`kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`source` text NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`last_used_at` text
);
--> statement-breakpoint
CREATE TABLE `meal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`food_id` integer,
	`custom_name` text,
	`servings` real NOT NULL,
	`kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`meal_slot` text NOT NULL,
	`logged_at_utc` text NOT NULL,
	`local_date` text NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `meal_entries_local_date_idx` ON `meal_entries` (`local_date`);--> statement-breakpoint
CREATE INDEX `meal_entries_logged_at_utc_idx` ON `meal_entries` (`logged_at_utc`);--> statement-breakpoint
CREATE TABLE `points_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`local_date` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`sex` text NOT NULL,
	`height_cm` real NOT NULL,
	`weight_kg` real NOT NULL,
	`activity_level` text NOT NULL,
	`goal` text NOT NULL,
	`weekly_rate_pct` real NOT NULL,
	`timezone` text NOT NULL,
	`daily_kcal_target` integer NOT NULL,
	`protein_g_target` integer NOT NULL,
	`carbs_g_target` integer NOT NULL,
	`fat_g_target` integer NOT NULL,
	`sound_enabled` integer DEFAULT true NOT NULL,
	`haptics_enabled` integer DEFAULT true NOT NULL,
	`tracking_paused` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`local_date` text NOT NULL,
	`type` text NOT NULL,
	`target` integer NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `streak_freezes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`granted_local_date` text NOT NULL,
	`consumed_local_date` text
);
