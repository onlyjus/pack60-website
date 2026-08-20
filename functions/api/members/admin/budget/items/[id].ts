import {
  findBudgetItem,
  validateBudgetItemInput,
} from '../../../../../_lib/budget';
import {
  json,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../../../_lib/http';
import type { AppPagesFunction } from '../../../../../_lib/types';

function itemId(context: EventContext<CloudflareEnv, 'id', unknown>): string {
  return Array.isArray(context.params.id)
    ? context.params.id[0]
    : context.params.id;
}

export const onRequestPatch: AppPagesFunction<'id'> = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const id = itemId(context);
  const existing = await findBudgetItem(context.env.DB, id);
  if (!existing) return json({ error: 'Budget item not found.' }, 404);

  const validated = validateBudgetItemInput(
    await readJsonObject(context.request),
  );
  if ('error' in validated) return json({ error: validated.error }, 400);

  const item = validated.value;
  const now = new Date().toISOString();
  await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE budget_items
         SET period = ?, kind = ?, category = ?, description = ?,
             budgeted_cents = ?, actual_cents = ?, notes = ?,
             updated_by_member_id = ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
    ).bind(
      item.period,
      item.kind,
      item.category,
      item.description,
      item.budgetedCents,
      item.actualCents,
      item.notes,
      actor.id,
      now,
      id,
    ),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'budget_item_updated', 'budget_item', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      actor.email,
      id,
      JSON.stringify({
        period: item.period,
        description: item.description,
        previousDescription: existing.description,
      }),
      now,
    ),
  ]);

  return json({ item: await findBudgetItem(context.env.DB, id) });
};

export const onRequestDelete: AppPagesFunction<'id'> = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const id = itemId(context);
  const existing = await findBudgetItem(context.env.DB, id);
  if (!existing) return json({ error: 'Budget item not found.' }, 404);

  const now = new Date().toISOString();
  await context.env.DB.batch([
    context.env.DB.prepare(
      `UPDATE budget_items
         SET deleted_at = ?, updated_by_member_id = ?, updated_at = ?
         WHERE id = ? AND deleted_at IS NULL`,
    ).bind(now, actor.id, now, id),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'budget_item_deleted', 'budget_item', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      actor.email,
      id,
      JSON.stringify({
        period: existing.period,
        description: existing.description,
      }),
      now,
    ),
  ]);

  return json({ success: true });
};
