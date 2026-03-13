import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { rateLimit } from '@/src/lib/rate-limit';
import { collectDigestData, generateDigestNarrative, buildDigestEmailHtml, sendDigestEmail } from '@/src/lib/digest';

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = rateLimit(`digest:send:${session.user.id}`, { maxAttempts: 3, windowMs: 24 * 60 * 60 * 1000 });
  if (!limit.success) return NextResponse.json({ error: 'You can only send the digest 3 times per day.' }, { status: 429 });

  try {
    const data = await collectDigestData(session.user.id);
    const narrative = await generateDigestNarrative(data);
    const html = buildDigestEmailHtml(data, narrative);
    const subject = `Your weekly digest — ${data.weekRange}`;

    await sendDigestEmail(data.user.email, subject, html);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastDigestSentAt: new Date() },
    });

    return NextResponse.json({ sent: true, email: data.user.email });
  } catch (err) {
    console.error('[digest/send] error:', err);
    return NextResponse.json({ error: 'Failed to send digest.' }, { status: 500 });
  }
}
