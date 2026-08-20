CREATE TABLE `budget_items` (
	`id` text PRIMARY KEY NOT NULL,
	`period` text NOT NULL,
	`kind` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`budgeted_cents` integer DEFAULT 0 NOT NULL,
	`actual_cents` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_by_member_id` text NOT NULL,
	`updated_by_member_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT "budget_items_kind_check" CHECK("budget_items"."kind" IN ('income', 'expense')),
	CONSTRAINT "budget_items_budgeted_check" CHECK("budget_items"."budgeted_cents" >= 0),
	CONSTRAINT "budget_items_actual_check" CHECK("budget_items"."actual_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_budget_items_period` ON `budget_items` (`period`,`kind`);--> statement-breakpoint
CREATE INDEX `idx_budget_items_active` ON `budget_items` (`deleted_at`,`period`);--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_by_member_id` text NOT NULL,
	`updated_by_member_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	CONSTRAINT "calendar_events_status_check" CHECK("calendar_events"."status" IN ('planned', 'tentative', 'canceled'))
);
--> statement-breakpoint
CREATE INDEX `idx_calendar_events_starts_at` ON `calendar_events` (`starts_at`);--> statement-breakpoint
CREATE INDEX `idx_calendar_events_active` ON `calendar_events` (`deleted_at`,`starts_at`);--> statement-breakpoint
CREATE TABLE `calendar_subscriptions` (
	`member_id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`rotated_at` text NOT NULL,
	`revoked_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_calendar_subscriptions_token_hash` ON `calendar_subscriptions` (`token_hash`);