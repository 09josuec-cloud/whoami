import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');
  const category = searchParams.get('category');
  const accountId = searchParams.get('accountId');

  const now = new Date();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

  if (isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month parameter' }, { status: 400 });
  }
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    // Get all account IDs belonging to this user
    const userAccounts = await prisma.bankAccount.findMany({
      where: { plaidItem: { userId: session.user.id } },
      select: { id: true },
    });
    const userAccountIds = userAccounts.map((a: { id: string }) => a.id);

    // If a specific accountId is requested, verify it belongs to this user
    if (accountId && !userAccountIds.includes(accountId)) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        bankAccountId: accountId
          ? accountId
          : { in: userAccountIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(category ? { category } : {}),
      },
      include: {
        bankAccount: {
          select: {
            name: true,
            mask: true,
            plaidItem: {
              select: { institutionName: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 500,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[Plaid] transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
