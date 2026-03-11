import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connection = await prisma.calendarConnection.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: 'google' } },
    select: { id: true, lastSynced: true },
  });

  return NextResponse.json({ connected: !!connection, lastSynced: connection?.lastSynced ?? null });
}
