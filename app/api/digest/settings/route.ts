import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const patchSchema = z.object({
  digestEnabled: z.boolean().optional(),
  digestDay: z.number().int().min(0).max(6).optional(),
  digestTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format').optional(),
});

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { digestEnabled: true, digestDay: true, digestTime: true, lastDigestSentAt: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: { digestEnabled: true, digestDay: true, digestTime: true, lastDigestSentAt: true },
  });

  return NextResponse.json(updated);
}
