import type { BudgetItemKind, BudgetItemRecord } from './types';

export interface BudgetItemInput {
  period: string;
  kind: BudgetItemKind;
  category: string;
  description: string;
  budgetedCents: number;
  actualCents: number;
  notes: string;
}

type ValidationResult =
  | { value: BudgetItemInput; error?: never }
  | { value?: never; error: string };

export function isBudgetPeriod(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const month = /^(\d{4})-(0[1-9]|1[0-2])$/u.exec(value);
  if (month) {
    const year = Number(month[1]);
    return year >= 2020 && year <= 2100;
  }

  const programYear = /^(\d{4})-(\d{4})$/u.exec(value);
  if (!programYear) return false;

  const startYear = Number(programYear[1]);
  const endYear = Number(programYear[2]);
  return startYear >= 2020 && endYear === startYear + 1 && endYear <= 2100;
}

function boundedString(value: unknown, maximum: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length <= maximum ? normalized : undefined;
}

function validCents(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 100_000_000
  );
}

export function validateBudgetItemInput(
  body: Record<string, unknown> | null,
): ValidationResult {
  const period = body?.period;
  const kind = body?.kind;
  const category = boundedString(body?.category, 80);
  const description = boundedString(body?.description, 160);
  const notes = boundedString(body?.notes ?? '', 500);
  const budgetedCents = body?.budgetedCents;
  const actualCents = body?.actualCents;

  if (!isBudgetPeriod(period)) {
    return { error: 'Choose a valid budget period.' };
  }
  if (kind !== 'income' && kind !== 'expense') {
    return { error: 'Choose income or expense.' };
  }
  if (!category) {
    return { error: 'Enter a category up to 80 characters.' };
  }
  if (!description) {
    return { error: 'Enter a description up to 160 characters.' };
  }
  if (notes === undefined) {
    return { error: 'Notes must be 500 characters or fewer.' };
  }
  if (!validCents(budgetedCents) || !validCents(actualCents)) {
    return { error: 'Amounts must be between $0 and $1,000,000.' };
  }

  return {
    value: {
      period,
      kind,
      category,
      description,
      budgetedCents,
      actualCents,
      notes,
    },
  };
}

export async function listBudgetItems(
  db: D1Database,
  period: string,
): Promise<BudgetItemRecord[]> {
  const result = await db
    .prepare(
      `SELECT id, period, kind, category, description, budgeted_cents,
              actual_cents, notes, created_by_member_id,
              updated_by_member_id, created_at, updated_at, deleted_at
       FROM budget_items
       WHERE period = ? AND deleted_at IS NULL
       ORDER BY kind DESC, category ASC, description ASC
       LIMIT 500`,
    )
    .bind(period)
    .all<BudgetItemRecord>();

  return result.results;
}

export async function findBudgetItem(
  db: D1Database,
  id: string,
): Promise<BudgetItemRecord | null> {
  return db
    .prepare(
      `SELECT id, period, kind, category, description, budgeted_cents,
              actual_cents, notes, created_by_member_id,
              updated_by_member_id, created_at, updated_at, deleted_at
       FROM budget_items
       WHERE id = ? AND deleted_at IS NULL
       LIMIT 1`,
    )
    .bind(id)
    .first<BudgetItemRecord>();
}
