import { isBudgetPeriod, listBudgetItems } from '../../_lib/budget';
import { json } from '../../_lib/http';
import type { AppPagesFunction } from '../../_lib/types';

export const onRequestGet: AppPagesFunction = async (context) => {
  const period = new URL(context.request.url).searchParams.get('period');
  if (!isBudgetPeriod(period)) {
    return json({ error: 'Choose a valid budget month.' }, 400);
  }

  const items = await listBudgetItems(context.env.DB, period);
  const summary = items.reduce(
    (total, item) => {
      if (item.kind === 'income') {
        total.incomeBudgetedCents += item.budgeted_cents;
        total.incomeActualCents += item.actual_cents;
      } else {
        total.expenseBudgetedCents += item.budgeted_cents;
        total.expenseActualCents += item.actual_cents;
      }
      return total;
    },
    {
      incomeBudgetedCents: 0,
      incomeActualCents: 0,
      expenseBudgetedCents: 0,
      expenseActualCents: 0,
    },
  );

  return json({
    period,
    items,
    summary: {
      ...summary,
      netBudgetedCents:
        summary.incomeBudgetedCents - summary.expenseBudgetedCents,
      netActualCents: summary.incomeActualCents - summary.expenseActualCents,
    },
  });
};
