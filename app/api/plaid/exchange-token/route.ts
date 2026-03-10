import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { plaidClient } from '@/src/services/plaid/client';
import { prisma } from '@/src/lib/prisma';
import { getCategoryFromPlaid } from '@/src/lib/categories';

interface ExchangeTokenBody {
  public_token: string;
  institution: {
    name: string;
    institution_id: string;
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ExchangeTokenBody;
  try {
    body = (await req.json()) as ExchangeTokenBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { public_token, institution } = body;
  if (!public_token || !institution?.institution_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Store PlaidItem in DB
    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId: session.user.id,
        accessToken: access_token,
        itemId: item_id,
        institutionId: institution.institution_id,
        institutionName: institution.name,
      },
    });

    // Initial sync: fetch accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token,
    });

    for (const account of accountsResponse.data.accounts) {
      await prisma.bankAccount.upsert({
        where: { plaidAccountId: account.account_id },
        create: {
          plaidItemId: plaidItem.id,
          plaidAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name ?? null,
          type: account.type,
          subtype: account.subtype ?? null,
          mask: account.mask ?? null,
          currentBalance: account.balances.current ?? null,
          availableBalance: account.balances.available ?? null,
          currency: account.balances.iso_currency_code ?? 'USD',
        },
        update: {
          currentBalance: account.balances.current ?? null,
          availableBalance: account.balances.available ?? null,
        },
      });
    }

    // Initial transaction sync
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const syncResponse = await plaidClient.transactionsSync({
        access_token,
        cursor,
      });

      const { added, next_cursor, has_more } = syncResponse.data;

      // Find associated bank accounts for this item
      const bankAccounts = await prisma.bankAccount.findMany({
        where: { plaidItemId: plaidItem.id },
        select: { id: true, plaidAccountId: true },
      });
      const accountMap = new Map(bankAccounts.map((a) => [a.plaidAccountId, a.id]));

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
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Save cursor
    await prisma.plaidItem.update({
      where: { id: plaidItem.id },
      data: { cursor, lastSynced: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Plaid] exchange-token error:', error);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
