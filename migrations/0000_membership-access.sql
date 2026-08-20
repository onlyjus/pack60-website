CREATE TABLE `access_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_member_id` text,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`metadata_json` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_access_audit_log_created_at` ON `access_audit_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_access_audit_log_target` ON `access_audit_log` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `member_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_by_member_id` text NOT NULL,
	`use_count` integer DEFAULT 0 NOT NULL,
	`redeemed_at` text,
	`redeemed_by_member_id` text,
	`redeemed_by_email` text,
	`redemption_nonce` text,
	`revoked_at` text,
	`revoked_by_member_id` text,
	CONSTRAINT "member_invites_role_check" CHECK("member_invites"."role" IN ('member', 'admin')),
	CONSTRAINT "member_invites_use_count_check" CHECK("member_invites"."use_count" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_invites_token_hash` ON `member_invites` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_member_invites_email` ON `member_invites` (`email`);--> statement-breakpoint
CREATE INDEX `idx_member_invites_active` ON `member_invites` (`revoked_at`,`redeemed_at`,`expires_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`access_subject` text,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`activated_at` text NOT NULL,
	`last_login_at` text,
	`last_seen_at` text,
	`invited_by_member_id` text,
	`revoked_at` text,
	`revoked_by_member_id` text,
	CONSTRAINT "members_role_check" CHECK("members"."role" IN ('member', 'admin')),
	CONSTRAINT "members_status_check" CHECK("members"."status" IN ('active', 'revoked'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_email` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `idx_members_status_role` ON `members` (`status`,`role`);--> statement-breakpoint
PRAGMA optimize;
