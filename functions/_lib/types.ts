export type MemberRole = 'member' | 'admin';
export type MemberStatus = 'active' | 'revoked';
export type CalendarEventStatus = 'planned' | 'tentative' | 'canceled';
export type BudgetItemKind = 'income' | 'expense';

export type Env = CloudflareEnv;

export interface AccessIdentity {
  email: string;
  name: string | null;
  subject: string;
  loginAt: string;
}

export interface MemberRecord {
  id: string;
  email: string;
  display_name: string | null;
  access_subject: string | null;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
  activated_at: string;
  last_login_at: string | null;
  last_seen_at: string | null;
  invited_by_member_id: string | null;
  revoked_at: string | null;
  revoked_by_member_id: string | null;
}

export interface InviteRecord {
  id: string;
  email: string;
  role: MemberRole;
  created_at: string;
  expires_at: string;
  created_by_member_id: string;
  use_count: number;
  redeemed_at: string | null;
  redeemed_by_email: string | null;
  revoked_at: string | null;
}

export interface CalendarEventRecord {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  status: CalendarEventStatus;
  created_by_member_id: string;
  updated_by_member_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CalendarSubscriptionRecord {
  member_id: string;
  created_at: string;
  rotated_at: string;
  revoked_at: string | null;
}

export interface BudgetItemRecord {
  id: string;
  period: string;
  kind: BudgetItemKind;
  category: string;
  description: string;
  budgeted_cents: number;
  actual_cents: number;
  notes: string;
  created_by_member_id: string;
  updated_by_member_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AppData extends Record<string, unknown> {
  identity?: AccessIdentity;
  member?: MemberRecord;
}

export type AppPagesFunction<Params extends string = string> = PagesFunction<
  Env,
  Params,
  AppData
>;
