import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    accessSubject: text('access_subject'),
    role: text('role', { enum: ['member', 'admin'] })
      .notNull()
      .default('member'),
    status: text('status', { enum: ['active', 'revoked'] })
      .notNull()
      .default('active'),
    createdAt: text('created_at').notNull(),
    activatedAt: text('activated_at').notNull(),
    lastLoginAt: text('last_login_at'),
    lastSeenAt: text('last_seen_at'),
    invitedByMemberId: text('invited_by_member_id'),
    revokedAt: text('revoked_at'),
    revokedByMemberId: text('revoked_by_member_id'),
  },
  (table) => [
    uniqueIndex('idx_members_email').on(table.email),
    index('idx_members_status_role').on(table.status, table.role),
    check('members_role_check', sql`${table.role} IN ('member', 'admin')`),
    check(
      'members_status_check',
      sql`${table.status} IN ('active', 'revoked')`,
    ),
  ],
);

export const memberInvites = sqliteTable(
  'member_invites',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    role: text('role', { enum: ['member', 'admin'] })
      .notNull()
      .default('member'),
    tokenHash: text('token_hash').notNull(),
    createdAt: text('created_at').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdByMemberId: text('created_by_member_id').notNull(),
    useCount: integer('use_count').notNull().default(0),
    redeemedAt: text('redeemed_at'),
    redeemedByMemberId: text('redeemed_by_member_id'),
    redeemedByEmail: text('redeemed_by_email'),
    redemptionNonce: text('redemption_nonce'),
    revokedAt: text('revoked_at'),
    revokedByMemberId: text('revoked_by_member_id'),
  },
  (table) => [
    uniqueIndex('idx_member_invites_token_hash').on(table.tokenHash),
    index('idx_member_invites_email').on(table.email),
    index('idx_member_invites_active').on(
      table.revokedAt,
      table.redeemedAt,
      table.expiresAt,
    ),
    check(
      'member_invites_role_check',
      sql`${table.role} IN ('member', 'admin')`,
    ),
    check('member_invites_use_count_check', sql`${table.useCount} IN (0, 1)`),
  ],
);

export const accessAuditLog = sqliteTable(
  'access_audit_log',
  {
    id: text('id').primaryKey(),
    actorMemberId: text('actor_member_id'),
    actorEmail: text('actor_email').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    metadataJson: text('metadata_json'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_access_audit_log_created_at').on(table.createdAt),
    index('idx_access_audit_log_target').on(table.targetType, table.targetId),
  ],
);

export const calendarEvents = sqliteTable(
  'calendar_events',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    location: text('location').notNull().default(''),
    startsAt: text('starts_at').notNull(),
    endsAt: text('ends_at').notNull(),
    status: text('status', {
      enum: ['planned', 'tentative', 'canceled'],
    })
      .notNull()
      .default('planned'),
    createdByMemberId: text('created_by_member_id').notNull(),
    updatedByMemberId: text('updated_by_member_id').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('idx_calendar_events_starts_at').on(table.startsAt),
    index('idx_calendar_events_active').on(table.deletedAt, table.startsAt),
    check(
      'calendar_events_status_check',
      sql`${table.status} IN ('planned', 'tentative', 'canceled')`,
    ),
  ],
);

export const calendarSubscriptions = sqliteTable(
  'calendar_subscriptions',
  {
    memberId: text('member_id').primaryKey(),
    tokenHash: text('token_hash').notNull(),
    createdAt: text('created_at').notNull(),
    rotatedAt: text('rotated_at').notNull(),
    revokedAt: text('revoked_at'),
  },
  (table) => [
    uniqueIndex('idx_calendar_subscriptions_token_hash').on(table.tokenHash),
  ],
);

export const budgetItems = sqliteTable(
  'budget_items',
  {
    id: text('id').primaryKey(),
    period: text('period').notNull(),
    kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    budgetedCents: integer('budgeted_cents').notNull().default(0),
    actualCents: integer('actual_cents').notNull().default(0),
    notes: text('notes').notNull().default(''),
    createdByMemberId: text('created_by_member_id').notNull(),
    updatedByMemberId: text('updated_by_member_id').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    index('idx_budget_items_period').on(table.period, table.kind),
    index('idx_budget_items_active').on(table.deletedAt, table.period),
    check(
      'budget_items_kind_check',
      sql`${table.kind} IN ('income', 'expense')`,
    ),
    check('budget_items_budgeted_check', sql`${table.budgetedCents} >= 0`),
    check('budget_items_actual_check', sql`${table.actualCents} >= 0`),
  ],
);
