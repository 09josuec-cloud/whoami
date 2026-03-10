import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accounts = await prisma.bankAccount.findMany({
      where: {
        plaidItem: { userId: session.user.id },
      },
      include: {
        plaidItem: {
          select: {
            institutionName: true,
            institutionId: true,
            lastSynced: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('[Plaid] accounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
