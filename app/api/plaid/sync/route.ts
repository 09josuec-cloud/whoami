import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { plaidClient } from '@/src/services/plaid/client';
import { prisma } from '@/src/lib/prisma';
import { getCategoryFromPlaid } from '@/src/lib/categories';
import { generateSyncNotifications } from '@/src/lib/notifications';
import { rateLimit } from '@/src/lib/rate-limit';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: max 10 syncs per hour per user (Plaid syncs are expensive)
  const limit = rateLimit(`plaid-sync:${session.user.id}`, {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many sync requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: session.user.id },
      include: { accounts: true },
    });

    let totalSynced = 0;
    const allAddedTxs: Array<{
      plaidTransactionId: string;
      bankAccountId: string;
      name: string;
      amount: number;
      date: Date;
      category: string | null;
    }> = [];

    for (const item of plaidItems) {
      const accountMap = new Map(item.accounts.map((a: { plaidAccountId: string; id: string }) => [a.plaidAccountId, a.id]));
      let cursor: string | undefined = item.cursor ?? undefined;
      let hasMore = true;

      while (hasMore) {
        const syncResponse = await plaidClient.transactionsSync({
          access_token: item.accessToken,
          cursor,
          options: {
            days_requested: 730, // Request up to 2 years of transactions
          },
        });

        const { added, modified, removed, next_cursor, has_more } = syncResponse.data;

        // Counts only — no PII, account IDs, or transaction details logged
        console.log(`[Plaid Sync] added=${added.length} modified=${modified.length} removed=${removed.length} has_more=${has_more}`);

        // Process added transactions
        for (const tx of added) {
          const bankAccountId = accountMap.get(tx.account_id);
          if (!bankAccountId) continue;

          const primaryCategory = tx.personal_finance_category?.primary ?? tx.category?.[0] ?? null;
          const mappedCategory = getCategoryFromPlaid(primaryCategory);

          await prisma.transaction.upsert({
            where: { plaidTransactionId: tx.transaction_id },
            create: {
              bankAccountId,
              plaidTransactionId: tx.transaction_id,
              name: tx.name,
              merchantName: tx.merchant_name ?? null,
              amount: tx.amount,
              date: new Date(tx.date),
              category: mappedCategory,
              subCategory: tx.category?.[1] ?? null,
              pending: tx.pending,
              logoUrl: tx.logo_url ?? null,
            },
            update: {
              name: tx.name,
              merchantName: tx.merchant_name ?? null,
              amount: tx.amount,
              pending: tx.pending,
              category: mappedCategory,
            },
          });
          allAddedTxs.push({
            plaidTransactionId: tx.transaction_id,
            bankAccountId: bankAccountId as string,
            name: tx.merchant_name ?? tx.name,
            amount: tx.amount,
            date: new Date(tx.date),
            category: mappedCategory,
          });
          totalSynced++;
        }

        // Process modified transactions
        for (const tx of modified) {
          const primaryCategory = tx.personal_finance_category?.primary ?? tx.category?.[0] ?? null;
          const mappedCategory = getCategoryFromPlaid(primaryCategory);

          await prisma.transaction.updateMany({
            where: { plaidTransactionId: tx.transaction_id },
            data: {
              name: tx.name,
              merchantName: tx.merchant_name ?? null,
              amount: tx.amount,
              pending: tx.pending,
              category: mappedCategory,
            },
          });
        }

        // Process removed transactions
        for (const tx of removed) {
          await prisma.transaction.deleteMany({
            where: { plaidTransactionId: tx.transaction_id },
          });
        }

        cursor = next_cursor;
        hasMore = has_more;
      }

      // Update account balances
      const accountsResponse = await plaidClient.accountsGet({
        access_token: item.accessToken,
      });

      for (const account of accountsResponse.data.accounts) {
        await prisma.bankAccount.updateMany({
          where: { plaidAccountId: account.account_id },
          data: {
            currentBalance: account.balances.current ?? null,
            availableBalance: account.balances.available ?? null,
          },
        });
      }

      // Update cursor and lastSynced
      await prisma.plaidItem.update({
        where: { id: item.id },
        data: { cursor, lastSynced: new Date() },
      });
    }

    // Generate notifications for all synced data
    const updatedAccounts = await prisma.bankAccount.findMany({
      where: { plaidItem: { userId: session.user.id } },
      select: { id: true, type: true, currentBalance: true, availableBalance: true },
    });
    await generateSyncNotifications(session.user.id, allAddedTxs, updatedAccounts);

    // Capture net worth snapshot for history chart
    const LIABILITY_TYPES = ['credit', 'loan', 'mortgage'];
    let snapAssets = 0;
    let snapLiabilities = 0;
    for (const a of updatedAccounts) {
      const bal = a.currentBalance ?? 0;
      if (LIABILITY_TYPES.includes(a.type)) snapLiabilities += bal;
      else snapAssets += bal;
    }
    const now2 = new Date();
    const dateStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(now2.getDate()).padStart(2, '0')}`;
    await prisma.netWorthSnapshot.upsert({
      where: { userId_date: { userId: session.user.id, date: dateStr } },
      create: { userId: session.user.id, date: dateStr, netWorth: snapAssets - snapLiabilities, assets: snapAssets, liabilities: snapLiabilities },
      update: { netWorth: snapAssets - snapLiabilities, assets: snapAssets, liabilities: snapLiabilities },
    });

    return NextResponse.json({ synced: totalSynced });
  } catch {
    console.error('[Plaid] sync error: an unexpected error occurred during transaction sync');
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
