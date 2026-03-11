import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      select: { tags: true },
    });

    const tagSet = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        if (tag.trim()) tagSet.add(tag.trim());
      }
    }

    const tags = Array.from(tagSet).sort();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('[Journal] tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
