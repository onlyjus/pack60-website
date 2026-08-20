import { normalizeEmail } from './security';
import type {
  AccessIdentity,
  Env,
  InviteRecord,
  MemberRecord,
  MemberRole,
} from './types';

export async function findMemberByEmail(
  db: D1Database,
  email: string,
): Promise<MemberRecord | null> {
  return db
    .prepare(
      `SELECT id, email, display_name, access_subject, role, status,
              created_at, activated_at, last_login_at, last_seen_at,
              invited_by_member_id, revoked_at, revoked_by_member_id
       FROM members
       WHERE email = ?
       LIMIT 1`,
    )
    .bind(normalizeEmail(email))
    .first<MemberRecord>();
}

export async function findMemberById(
  db: D1Database,
  id: string,
): Promise<MemberRecord | null> {
  return db
    .prepare(
      `SELECT id, email, display_name, access_subject, role, status,
              created_at, activated_at, last_login_at, last_seen_at,
              invited_by_member_id, revoked_at, revoked_by_member_id
       FROM members
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first<MemberRecord>();
}

export async function ensureBootstrapAdmin(
  env: Env,
  identity: AccessIdentity,
): Promise<void> {
  const bootstrapEmail = env.BOOTSTRAP_ADMIN_EMAIL
    ? normalizeEmail(env.BOOTSTRAP_ADMIN_EMAIL)
    : null;

  if (!bootstrapEmail || identity.email !== bootstrapEmail) {
    return;
  }

  const activeAdmin = await env.DB.prepare(
    `SELECT id FROM members
     WHERE role = 'admin' AND status = 'active'
     LIMIT 1`,
  ).first<{ id: string }>();

  if (activeAdmin) {
    return;
  }

  const now = new Date().toISOString();
  const memberId = crypto.randomUUID();
  const auditId = crypto.randomUUID();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO members (
         id, email, display_name, access_subject, role, status,
         created_at, activated_at, last_login_at, last_seen_at
       ) VALUES (?, ?, ?, ?, 'admin', 'active', ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         display_name = COALESCE(excluded.display_name, members.display_name),
         access_subject = excluded.access_subject,
         role = 'admin',
         status = 'active',
         activated_at = excluded.activated_at,
         last_login_at = excluded.last_login_at,
         last_seen_at = excluded.last_seen_at,
         revoked_at = NULL,
         revoked_by_member_id = NULL`,
    ).bind(
      memberId,
      identity.email,
      identity.name,
      identity.subject,
      now,
      now,
      identity.loginAt,
      now,
    ),
    env.DB.prepare(
      `INSERT INTO access_audit_log (
         id, actor_member_id, actor_email, action, target_type,
         target_id, metadata_json, created_at
       ) VALUES (?, NULL, ?, 'bootstrap_admin', 'member', ?, NULL, ?)`,
    ).bind(auditId, identity.email, identity.email, now),
  ]);
}

export async function recordMemberActivity(
  db: D1Database,
  member: MemberRecord,
  identity: AccessIdentity,
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE members
       SET access_subject = ?,
           display_name = COALESCE(?, display_name),
           last_seen_at = ?,
           last_login_at = CASE
             WHEN last_login_at IS NULL OR last_login_at < ? THEN ?
             ELSE last_login_at
           END
       WHERE id = ?`,
    )
    .bind(
      identity.subject,
      identity.name,
      now,
      identity.loginAt,
      identity.loginAt,
      member.id,
    )
    .run();
}

export async function writeAuditLog(
  db: D1Database,
  actor: Pick<MemberRecord, 'id' | 'email'>,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO access_audit_log (
         id, actor_member_id, actor_email, action, target_type,
         target_id, metadata_json, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      actor.id,
      actor.email,
      action,
      targetType,
      targetId,
      metadata ? JSON.stringify(metadata) : null,
      new Date().toISOString(),
    )
    .run();
}

export async function listMembers(db: D1Database): Promise<MemberRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, email, display_name, access_subject, role, status,
              created_at, activated_at, last_login_at, last_seen_at,
              invited_by_member_id, revoked_at, revoked_by_member_id
       FROM members
       ORDER BY status ASC, role DESC, email ASC`,
    )
    .all<MemberRecord>();

  return result.results;
}

export async function listInvites(db: D1Database): Promise<InviteRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, email, role, created_at, expires_at, created_by_member_id,
              use_count, redeemed_at, redeemed_by_email, revoked_at
       FROM member_invites
       ORDER BY created_at DESC
       LIMIT 100`,
    )
    .all<InviteRecord>();

  return result.results;
}

export async function countActiveAdmins(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM members
       WHERE role = 'admin' AND status = 'active'`,
    )
    .first<{ count: number }>();

  return Number(result?.count ?? 0);
}

export async function createInvite(
  db: D1Database,
  actor: MemberRecord,
  input: {
    id: string;
    email: string;
    role: MemberRole;
    tokenHash: string;
    expiresAt: string;
  },
): Promise<void> {
  const now = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `UPDATE member_invites
       SET revoked_at = ?, revoked_by_member_id = ?
       WHERE email = ?
         AND redeemed_at IS NULL
         AND revoked_at IS NULL`,
      )
      .bind(now, actor.id, input.email),
    db
      .prepare(
        `INSERT INTO member_invites (
         id, email, role, token_hash, created_at, expires_at,
         created_by_member_id, use_count
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      )
      .bind(
        input.id,
        input.email,
        input.role,
        input.tokenHash,
        now,
        input.expiresAt,
        actor.id,
      ),
    db
      .prepare(
        `INSERT INTO access_audit_log (
         id, actor_member_id, actor_email, action, target_type,
         target_id, metadata_json, created_at
       ) VALUES (?, ?, ?, 'invite_created', 'invite', ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        actor.id,
        actor.email,
        input.id,
        JSON.stringify({
          email: input.email,
          role: input.role,
          expiresAt: input.expiresAt,
        }),
        now,
      ),
  ]);
}
