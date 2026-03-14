import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { collectDigestData, generateDigestNarrative, buildDigestEmailHtml, sendDigestEmail } from '@/src/lib/digest';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Security: only Vercel cron (via CRON_SECRET) can call this
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowUTC = new Date();
  const currentDay = nowUTC.getUTCDay();    // 0=Sun … 6=Sat
  const todayStr = nowUTC.toISOString().slice(0, 10);

  const users = await prisma.user.findMany({
    where: { digestEnabled: true },
    select: { id: true, email: true, name: true, digestDay: true, digestTime: true, lastDigestSentAt: true },
  });

  let processed = 0;
  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    // Already sent today — skip
    const lastSentStr = user.lastDigestSentAt?.toISOString().slice(0, 10);
    if (lastSentStr === todayStr) continue;

    // Check day match (cron fires daily at 8AM UTC — only send on user's chosen day)
    if (currentDay !== user.digestDay) continue;

    processed++;
    try {
      const data = await collectDigestData(user.id);
      const narrative = await generateDigestNarrative(data);
      const html = buildDigestEmailHtml(data, narrative);
      const subject = `Your weekly digest — ${data.weekRange}`;

      await sendDigestEmail(data.user.email, subject, html);

      await prisma.user.update({
        where: { id: user.id },
        data: { lastDigestSentAt: new Date() },
      });

      sent++;
    } catch (err) {
      const msg = `${user.email}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error('[cron/weekly-digest] error for user', user.id, err);
    }
  }

  return NextResponse.json({ processed, sent, errors });
}
