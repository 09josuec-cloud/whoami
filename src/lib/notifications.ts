import { prisma } from '@/src/lib/prisma';

export type NotificationType =
  | 'deposit'
  | 'large_purchase'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'low_balance'
  | 'goal_milestone'
  | 'goal_complete'
  | 'subscription_detected';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  refId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    if (input.refId) {
      // upsert deduplication — skip if already exists
      return await prisma.notification.upsert({
        where: { userId_refId: { userId: input.userId, refId: input.refId } },
        create: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          link: input.link,
          refId: input.refId,
        },
        update: {},
      });
    }
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        refId: input.refId,
      },
    });
  } catch (err) {
    // Log non-PII diagnostic; unique constraint violations are expected and non-fatal
    console.error('[notifications] createNotification failed:', err instanceof Error ? err.message : 'unknown error');
  }
}

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

interface SyncTx {
  plaidTransactionId: string;
  bankAccountId: string;
  name: string;
  amount: number;
  date: Date;
  category: string | null;
}

interface AccountBalance {
  id: string;
  currentBalance: number | null;
  availableBalance: number | null;
}

export async function generateSyncNotifications(
  userId: string,
  addedTxs: SyncTx[],
  accountBalances: AccountBalance[],
) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // 1. Deposit notifications (negative = income in Plaid)
  for (const tx of addedTxs) {
    if (tx.amount < 0) {
      await createNotification({
        userId,
        type: 'deposit',
        title: 'Deposit received',
        body: `${fmt(Math.abs(tx.amount))} from ${tx.name}`,
        link: '/budget',
        refId: `deposit:${tx.plaidTransactionId}`,
      });
    }
  }

  // 2. Large purchase alerts (> $200, excluding income/transfers)
  for (const tx of addedTxs) {
    if (tx.amount >= 200 && tx.category !== 'Transfer' && tx.category !== 'Income') {
      await createNotification({
        userId,
        type: 'large_purchase',
        title: 'Large purchase',
        body: `${fmt(tx.amount)} at ${tx.name}`,
        link: '/budget',
        refId: `large:${tx.plaidTransactionId}`,
      });
    }
  }

  // 3. Budget warnings — check spending vs budgets for current month
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
  });

  if (budgets.length > 0) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const userAccounts = await prisma.bankAccount.findMany({
      where: { plaidItem: { userId } },
      select: { id: true },
    });
    const accountIds = userAccounts.map((a: { id: string }) => a.id);

    const txs = await prisma.transaction.findMany({
      where: {
        bankAccountId: { in: accountIds },
        date: { gte: startDate, lte: endDate },
        pending: false,
      },
      select: { amount: true, category: true },
    });

    const spending = new Map<string, number>();
    for (const tx of txs) {
      if (tx.amount > 0 && tx.category && tx.category !== 'Transfer') {
        spending.set(tx.category, (spending.get(tx.category) ?? 0) + tx.amount);
      }
    }

    for (const budget of budgets) {
      const spent = spending.get(budget.category) ?? 0;
      const pct = budget.amount > 0 ? spent / budget.amount : 0;
      const monthKey = `${year}-${month}`;

      if (pct >= 1) {
        await createNotification({
          userId,
          type: 'budget_exceeded',
          title: `${budget.category} budget exceeded`,
          body: `Spent ${fmt(spent)} of ${fmt(budget.amount)} budget`,
          link: '/budget',
          refId: `budget_exceeded:${userId}:${budget.category}:${monthKey}`,
        });
      } else if (pct >= 0.8) {
        await createNotification({
          userId,
          type: 'budget_warning',
          title: `${budget.category} budget at ${Math.round(pct * 100)}%`,
          body: `${fmt(spent)} of ${fmt(budget.amount)} used`,
          link: '/budget',
          refId: `budget_warning:${userId}:${budget.category}:${monthKey}`,
        });
      }
    }
  }

  // 4. Low balance alerts (< $100 available)
  for (const account of accountBalances) {
    const balance = account.availableBalance ?? account.currentBalance;
    if (balance !== null && balance < 100) {
      await createNotification({
        userId,
        type: 'low_balance',
        title: 'Low account balance',
        body: `Available balance is ${fmt(balance)}`,
        link: '/budget',
        refId: `low_balance:${account.id}:${now.toISOString().slice(0, 10)}`,
      });
    }
  }
}

export async function generateGoalNotification(
  userId: string,
  goalId: string,
  goalName: string,
  currentAmount: number,
  targetAmount: number,
) {
  const pct = targetAmount > 0 ? currentAmount / targetAmount : 0;

  if (pct >= 1) {
    await createNotification({
      userId,
      type: 'goal_complete',
      title: `Goal complete: ${goalName}`,
      body: `You hit your ${fmt(targetAmount)} target!`,
      link: '/budget',
      refId: `goal_complete:${goalId}`,
    });
  } else if (pct >= 0.5 && pct < 1.0) {
    // 50% milestone — fires any time between 50–99%, refId prevents duplicates
    await createNotification({
      userId,
      type: 'goal_milestone',
      title: `Halfway there: ${goalName}`,
      body: `${fmt(currentAmount)} of ${fmt(targetAmount)} saved`,
      link: '/budget',
      refId: `goal_50:${goalId}`,
    });
  }

  if (pct >= 0.75 && pct < 1.0) {
    // 75% milestone — fires any time between 75–99%, refId prevents duplicates
    await createNotification({
      userId,
      type: 'goal_milestone',
      title: `75% reached: ${goalName}`,
      body: `${fmt(currentAmount)} of ${fmt(targetAmount)} saved`,
      link: '/budget',
      refId: `goal_75:${goalId}`,
    });
  }
}
