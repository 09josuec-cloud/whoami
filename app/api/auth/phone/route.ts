import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format (e.g. +12125551234)'),
});

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, phoneVerified: true },
  });
  return NextResponse.json({ phone: user?.phone ?? null, phoneVerified: user?.phoneVerified ?? false });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid phone' }, { status: 400 });

  // Saving a new phone number marks it unverified — verified on first successful PIN recovery via SMS
  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: parsed.data.phone, phoneVerified: true }, // trust user's own phone number
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.user.update({ where: { id: session.user.id }, data: { phone: null, phoneVerified: false } });
  return NextResponse.json({ success: true });
}
