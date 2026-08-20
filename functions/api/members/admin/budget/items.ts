import {
  findBudgetItem,
  validateBudgetItemInput,
} from '../../../../_lib/budget';
import {
  json,
  readJsonObject,
  requireSameOriginMutation,
} from '../../../../_lib/http';
import type { AppPagesFunction } from '../../../../_lib/types';

export const onRequestPost: AppPagesFunction = async (context) => {
  const originError = requireSameOriginMutation(context.request);
  if (originError) return originError;

  const actor = context.data.member;
  if (!actor) return json({ error: 'Administrator access is required.' }, 403);

  const validated = validateBudgetItemInput(
    await readJsonObject(context.request),
  );
  if ('error' in validated) return json({ error: validated.error }, 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const item = validated.value;
  await context.env.DB.batch([
    context.env.DB.prepare(
      `INSERT INTO budget_items (
           id, period, kind, category, description, budgeted_cents,
           actual_cents, notes, created_by_member_id, updated_by_member_id,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      item.period,
      item.kind,
      item.category,
      item.description,
      item.budgetedCents,
      item.actualCents,
      item.notes,
      actor.id,
      actor.id,
      now,
      now,
    ),
    context.env.DB.prepare(
      `INSERT INTO access_audit_log (
           id, actor_member_id, actor_email, action, target_type,
           target_id, metadata_json, created_at
         ) VALUES (?, ?, ?, 'budget_item_created', 'budget_item', ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      actor.id,
      actor.email,
      id,
      JSON.stringify({ period: item.period, description: item.description }),
      now,
    ),
  ]);

  return json({ item: await findBudgetItem(context.env.DB, id) }, 201);
};
