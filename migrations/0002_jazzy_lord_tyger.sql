PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`all_day` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_by_member_id` text NOT NULL,
	`updated_by_member_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT "calendar_events_status_check" CHECK("__new_calendar_events"."status" IN ('planned', 'tentative', 'canceled')),
	CONSTRAINT "calendar_events_all_day_check" CHECK("__new_calendar_events"."all_day" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_calendar_events`("id", "title", "description", "location", "starts_at", "ends_at", "all_day", "status", "created_by_member_id", "updated_by_member_id", "created_at", "updated_at", "deleted_at") SELECT "id", "title", "description", "location", "starts_at", "ends_at", 0, "status", "created_by_member_id", "updated_by_member_id", "created_at", "updated_at", "deleted_at" FROM `calendar_events`;--> statement-breakpoint
DROP TABLE `calendar_events`;--> statement-breakpoint
ALTER TABLE `__new_calendar_events` RENAME TO `calendar_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_calendar_events_starts_at` ON `calendar_events` (`starts_at`);--> statement-breakpoint
CREATE INDEX `idx_calendar_events_active` ON `calendar_events` (`deleted_at`,`starts_at`);
