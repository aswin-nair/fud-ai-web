CREATE TABLE `sync_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mutation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`kind` text NOT NULL,
	`entity_json` text NOT NULL,
	`base_cursor` integer DEFAULT 0 NOT NULL,
	`queued_at` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text NOT NULL,
	`last_error` text,
	`acked_cursor` integer,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sync_outbox_mutation_id_idx` ON `sync_outbox` (`mutation_id`);
--> statement-breakpoint
CREATE INDEX `sync_outbox_user_queued_idx` ON `sync_outbox` (`user_id`,`queued_at`);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`user_id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`cursor` integer DEFAULT 0 NOT NULL,
	`last_ack_at` text,
	`last_error` text
);
