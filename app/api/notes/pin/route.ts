import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { hash, verify } from '@node-rs/argon2';
import { rateLimit } from '@/src/lib/rate-limit';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notesPin: true },
  });
  return NextResponse.json({ hasPin: !!user?.notesPin });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { pin?: string };
  try { body = (await req.json()) as { pin?: string }; }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  if (!body.pin || !/^\d{4,6}$/.test(body.pin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { notesPin: true } });
  if (user?.notesPin) return NextResponse.json({ error: 'PIN already set' }, { status: 409 });

  await prisma.user.update({ where: { id: session.user.id }, data: { notesPin: await hash(body.pin) } });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = rateLimit(`notes-pin-change:${session.user.id}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.success) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });

  let body: { currentPin?: string; newPin?: string };
  try { body = (await req.json()) as { currentPin?: string; newPin?: string }; }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  if (!body.currentPin || !body.newPin) return NextResponse.json({ error: 'currentPin and newPin required' }, { status: 400 });
  if (!/^\d{4,6}$/.test(body.newPin)) return NextResponse.json({ error: 'New PIN must be 4–6 digits' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { notesPin: true } });
  if (!user?.notesPin) return NextResponse.json({ error: 'No PIN set' }, { status: 400 });

  if (!await verify(user.notesPin, body.currentPin)) return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });

  await prisma.user.update({ where: { id: session.user.id }, data: { notesPin: await hash(body.newPin) } });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = rateLimit(`notes-pin-delete:${session.user.id}`, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });
  if (!limit.success) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });

  let body: { currentPin?: string };
  try { body = (await req.json()) as { currentPin?: string }; }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  if (!body.currentPin) return NextResponse.json({ error: 'currentPin required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { notesPin: true } });
  if (!user?.notesPin) return NextResponse.json({ error: 'No PIN set' }, { status: 400 });

  if (!await verify(user.notesPin, body.currentPin)) return NextResponse.json({ error: 'PIN is incorrect' }, { status: 401 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { notesPin: null } }),
    prisma.note.updateMany({ where: { userId: session.user.id }, data: { locked: false, pinAttempts: 0 } }),
  ]);
  return NextResponse.json({ success: true });
}
