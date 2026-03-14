import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { prisma } from '@/src/lib/prisma';

function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(process.env.RESEND_API_KEY);
}

const MOOD_LABELS: Record<number, string> = { 1: 'Rough', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DigestData {
  user: { name: string | null; email: string };
  period: { start: Date; end: Date };
  weekRange: string;

  // Journal / Mood
  journalCount: number;
  avgMood: number | null;
  moodLabel: string | null;

  // Habits
  habits: { name: string; icon: string | null; completedDays: number; targetDays: number }[];
  overallHabitPct: number;

  // Health
  avgSteps: number | null;
  avgSleep: number | null;
  avgHeartRate: number | null;

  // Financial
  totalSpend: number;
  topCategories: { name: string; amount: number }[];
  netWorthDelta: number | null;
  savingsGoals: { name: string; emoji: string | null; pct: number; current: number; target: number }[];

  // Week ahead
  upcomingEvents: { title: string; start: Date; allDay: boolean }[];
  upcomingReminders: { title: string; dueAt: Date }[];
}

// ─── Data collection ─────────────────────────────────────────────────────────

export async function collectDigestData(userId: string): Promise<DigestData> {
  const now = new Date();

  // Last full Mon–Sun window
  const dayOfWeek = now.getUTCDay(); // 0=Sun
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekEnd = new Date(now);
  weekEnd.setUTCDate(now.getUTCDate() - (dayOfWeek === 0 ? 0 : dayOfWeek));
  weekEnd.setUTCHours(23, 59, 59, 999);
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekEnd.getUTCDate() - 6);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  // One week ago snapshot date
  const prevWeekStr = new Date(weekStart.getTime() - 86400000).toISOString().slice(0, 10);

  const sevenDaysLater = new Date(now);
  sevenDaysLater.setUTCDate(now.getUTCDate() + 7);

  const [
    user,
    journalEntries,
    habits,
    healthMetrics,
    transactions,
    snapshots,
    savingsGoals,
    upcomingEvents,
    upcomingReminders,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    prisma.journalEntry.findMany({
      where: { userId, entryDate: { gte: weekStart, lte: weekEnd } },
      select: { mood: true },
    }),
    prisma.habit.findMany({
      where: { userId, archived: false },
      include: { logs: { where: { date: { gte: weekStartStr, lte: weekEndStr } } } },
    }),
    prisma.healthMetric.findMany({
      where: { userId, date: { gte: weekStartStr, lte: weekEndStr } },
      select: { type: true, value: true },
    }),
    prisma.transaction.findMany({
      where: {
        bankAccount: { plaidItem: { userId } },
        date: { gte: weekStart, lte: weekEnd },
        pending: false,
        amount: { gt: 0 },
        NOT: { category: 'Transfer' },
      },
      select: { amount: true, category: true },
    }),
    prisma.netWorthSnapshot.findMany({
      where: { userId, date: { in: [weekStartStr, weekEndStr, prevWeekStr] } },
      orderBy: { date: 'asc' },
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      select: { name: true, emoji: true, targetAmount: true, currentAmount: true },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, start: { gte: now, lte: sevenDaysLater } },
      select: { title: true, start: true, allDay: true },
      orderBy: { start: 'asc' },
      take: 8,
    }),
    prisma.reminder.findMany({
      where: { userId, done: false, dueAt: { gte: now, lte: sevenDaysLater } },
      select: { title: true, dueAt: true },
      orderBy: { dueAt: 'asc' },
      take: 8,
    }),
  ]);

  // Mood
  const moodEntries = journalEntries.filter((e) => e.mood !== null);
  const avgMood = moodEntries.length > 0
    ? Math.round((moodEntries.reduce((s, e) => s + (e.mood ?? 0), 0) / moodEntries.length) * 10) / 10
    : null;
  const moodLabel = avgMood !== null ? (MOOD_LABELS[Math.round(avgMood)] ?? null) : null;

  // Habits
  const habitRows = habits.map((h) => {
    const targetDays = 7; // simplification; daily habits target 7 days
    return {
      name: h.name,
      icon: h.icon,
      completedDays: h.logs.length,
      targetDays,
    };
  });
  const totalPossible = habitRows.reduce((s, h) => s + h.targetDays, 0);
  const totalCompleted = habitRows.reduce((s, h) => s + Math.min(h.completedDays, h.targetDays), 0);
  const overallHabitPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Health
  const healthByType: Record<string, number[]> = {};
  for (const m of healthMetrics) {
    if (!healthByType[m.type]) healthByType[m.type] = [];
    healthByType[m.type].push(m.value);
  }
  const avg = (arr: number[] | undefined) =>
    arr && arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
  const avgSteps = avg(healthByType['steps']);
  const avgSleep = healthByType['sleep']
    ? Math.round((healthByType['sleep'].reduce((s, v) => s + v, 0) / healthByType['sleep'].length) * 10) / 10
    : null;
  const avgHeartRate = avg(healthByType['heart_rate']);

  // Spending
  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);
  const categoryMap: Record<string, number> = {};
  for (const t of transactions) {
    if (t.category) {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
    }
  }
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  // Net worth delta
  let netWorthDelta: number | null = null;
  if (snapshots.length >= 2) {
    const first = snapshots[0].netWorth;
    const last = snapshots[snapshots.length - 1].netWorth;
    netWorthDelta = last - first;
  }

  // Savings goals
  const goals = savingsGoals.map((g) => ({
    name: g.name,
    emoji: g.emoji,
    pct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
    current: g.currentAmount,
    target: g.targetAmount,
  }));

  // Week range label
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekRange = `${fmt(weekStart)} – ${fmt(weekEnd)}`;

  return {
    user,
    period: { start: weekStart, end: weekEnd },
    weekRange,
    journalCount: journalEntries.length,
    avgMood,
    moodLabel,
    habits: habitRows,
    overallHabitPct,
    avgSteps,
    avgSleep,
    avgHeartRate,
    totalSpend,
    topCategories,
    netWorthDelta,
    savingsGoals: goals,
    upcomingEvents: upcomingEvents.map((e) => ({ title: e.title, start: e.start, allDay: e.allDay })),
    upcomingReminders: upcomingReminders.map((r) => ({ title: r.title, dueAt: r.dueAt })),
  };
}

// ─── Claude narrative generation ─────────────────────────────────────────────

export async function generateDigestNarrative(data: DigestData): Promise<string> {
  const firstName = data.user.name?.split(' ')[0] ?? 'there';
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const habitLines = data.habits.length > 0
    ? data.habits.map((h) => `- ${h.icon ? h.icon + ' ' : ''}${h.name}: ${h.completedDays}/${h.targetDays} days`).join('\n')
    : 'No habits tracked this week.';

  const goalLines = data.savingsGoals.length > 0
    ? data.savingsGoals.map((g) => `- ${g.emoji ? g.emoji + ' ' : ''}${g.name}: ${g.pct}% (${fmtCurrency(g.current)} / ${fmtCurrency(g.target)})`).join('\n')
    : 'No savings goals set.';

  const eventLines = data.upcomingEvents.length > 0
    ? data.upcomingEvents.map((e) => `- ${e.title} (${e.allDay ? e.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : e.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + e.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})`).join('\n')
    : 'Nothing on the calendar yet.';

  const reminderLines = data.upcomingReminders.length > 0
    ? data.upcomingReminders.slice(0, 4).map((r) => `- ${r.title}`).join('\n')
    : 'No upcoming reminders.';

  const userContent = `Here is ${firstName}'s data for the week of ${data.weekRange}:

MOOD & JOURNAL
Entries written: ${data.journalCount}
Average mood: ${data.avgMood !== null ? `${data.avgMood}/5 (${data.moodLabel})` : 'No mood data'}

HABITS (${data.overallHabitPct}% overall completion this week)
${habitLines}

HEALTH
Average steps/day: ${data.avgSteps !== null ? data.avgSteps.toLocaleString() : 'no data'}
Average sleep: ${data.avgSleep !== null ? `${data.avgSleep}h` : 'no data'}
Average heart rate: ${data.avgHeartRate !== null ? `${data.avgHeartRate} bpm` : 'no data'}

FINANCES
Spending this week: ${fmtCurrency(data.totalSpend)}
Top categories: ${data.topCategories.length > 0 ? data.topCategories.map((c) => `${c.name} (${fmtCurrency(c.amount)})`).join(', ') : 'none'}
Net worth change: ${data.netWorthDelta !== null ? (data.netWorthDelta >= 0 ? '+' : '') + fmtCurrency(data.netWorthDelta) : 'no data'}
Savings goals:
${goalLines}

COMING UP (next 7 days)
Events:
${eventLines}
Reminders:
${reminderLines}

Write the 3-paragraph narrative now.`;

  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: `You are a warm, insightful personal assistant for a life OS called "whoami".
Write a weekly digest email in plain English. Your tone is encouraging, observational, and personal — like a trusted advisor reviewing someone's week.
Never be preachy. Do not use bullet points or markdown formatting. Write exactly 3 paragraphs:
1. Reflection on the week just passed (mood, journal, habit highlights)
2. Financial and health snapshot with context
3. Brief encouragement for the week ahead based on their upcoming calendar and goals

Keep total length under 280 words. Address the person by their first name: ${firstName}.`,
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : 'Unable to generate digest.';
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

export function buildDigestEmailHtml(data: DigestData, narrative: string): string {
  const firstName = data.user.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const moodDisplay = data.avgMood !== null ? `${data.avgMood}/5` : '—';
  const habitDisplay = `${data.overallHabitPct}%`;
  const spendDisplay = fmtCurrency(data.totalSpend);
  const stepsDisplay = data.avgSteps !== null ? data.avgSteps.toLocaleString() : '—';

  const paragraphs = narrative
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.7;">${p.trim()}</p>`)
    .join('');

  const eventRows = data.upcomingEvents.length > 0
    ? data.upcomingEvents.slice(0, 5).map((e) => {
        const dateStr = e.allDay
          ? e.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : e.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + e.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <div style="width:8px;height:8px;border-radius:50%;background:#6366f1;flex-shrink:0;"></div>
          <div>
            <p style="margin:0;color:#e4e4e7;font-size:14px;font-weight:500;">${e.title}</p>
            <p style="margin:2px 0 0;color:#71717a;font-size:12px;">${dateStr}</p>
          </div>
        </div>`;
      }).join('')
    : `<p style="margin:0;color:#52525b;font-size:14px;">Nothing scheduled — enjoy the open week.</p>`;

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://whoami.company';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Weekly Digest</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

<div style="background:#0a0a0a;padding:40px 20px;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:36px 40px;">
      <p style="margin:0 0 8px;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:2px;text-transform:uppercase;">whoami · weekly digest</p>
      <h1 style="margin:0 0 4px;color:#ffffff;font-size:26px;font-weight:700;">${greeting}, ${firstName}</h1>
      <p style="margin:0;color:rgba(255,255,255,0.55);font-size:13px;">${data.weekRange}</p>
    </div>

    <!-- Stats row -->
    <table style="width:100%;border-collapse:collapse;background:#111114;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
      <tr>
        <td style="padding:20px 16px;text-align:center;border-right:1px solid rgba(255,255,255,0.05);width:25%;">
          <p style="margin:0 0 4px;color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Mood</p>
          <p style="margin:0 0 2px;color:#f4f4f5;font-size:22px;font-weight:700;">${moodDisplay}</p>
          <p style="margin:0;color:#71717a;font-size:10px;">${data.moodLabel ?? (data.journalCount === 0 ? 'no entries' : 'no mood')}</p>
        </td>
        <td style="padding:20px 16px;text-align:center;border-right:1px solid rgba(255,255,255,0.05);width:25%;">
          <p style="margin:0 0 4px;color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Habits</p>
          <p style="margin:0 0 2px;color:#f4f4f5;font-size:22px;font-weight:700;">${habitDisplay}</p>
          <p style="margin:0;color:#71717a;font-size:10px;">completion</p>
        </td>
        <td style="padding:20px 16px;text-align:center;border-right:1px solid rgba(255,255,255,0.05);width:25%;">
          <p style="margin:0 0 4px;color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Spend</p>
          <p style="margin:0 0 2px;color:#f4f4f5;font-size:22px;font-weight:700;">${spendDisplay}</p>
          <p style="margin:0;color:#71717a;font-size:10px;">this week</p>
        </td>
        <td style="padding:20px 16px;text-align:center;width:25%;">
          <p style="margin:0 0 4px;color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Steps</p>
          <p style="margin:0 0 2px;color:#f4f4f5;font-size:22px;font-weight:700;">${stepsDisplay}</p>
          <p style="margin:0;color:#71717a;font-size:10px;">daily avg</p>
        </td>
      </tr>
    </table>

    <!-- AI Narrative -->
    <div style="background:#111114;padding:32px 40px;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0 0 20px;color:#a5b4fc;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Your Week in Review</p>
      ${paragraphs}
    </div>

    <!-- Week ahead -->
    <div style="background:#111114;padding:24px 40px 32px;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
      <p style="margin:0 0 16px;color:#a5b4fc;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">Coming Up</p>
      ${eventRows}
    </div>

    <!-- Footer -->
    <div style="background:#0e0e12;border-radius:0 0 16px 16px;border:1px solid rgba(255,255,255,0.06);border-top:none;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#3f3f46;font-size:12px;">
        whoami · your personal OS &nbsp;·&nbsp;
        <a href="${appUrl}/settings" style="color:#6366f1;text-decoration:none;">manage digest</a>
      </p>
    </div>

  </div>
</div>

</body>
</html>`;
}

// ─── Send via Resend ──────────────────────────────────────────────────────────

export async function sendDigestEmail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? 'noreply@whoami.company';
  await getResend().emails.send({ from, to, subject, html });
}
