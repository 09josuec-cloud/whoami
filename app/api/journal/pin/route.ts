import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { hash } from '@node-rs/argon2';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  return NextResponse.json({ hasPin: !!user?.journalPin });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { pin?: string };
  try {
    body = (await req.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.pin || !/^\d{4,6}$/.test(body.pin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  if (user?.journalPin) {
    return NextResponse.json({ error: 'PIN already set' }, { status: 409 });
  }

  const hashed = await hash(body.pin);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { journalPin: hashed },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
