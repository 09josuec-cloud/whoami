import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { google } from 'googleapis';
import { rateLimit } from '@/src/lib/rate-limit';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limit Google Calendar syncs: max 20 per hour per user
  const syncLimit = rateLimit(`google-cal-sync:${userId}`, {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!syncLimit.success) {
    return NextResponse.json(
      { error: 'Too many sync requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((syncLimit.reset - Date.now()) / 1000)),
        },
      }
    );
  }

  const connection = await prisma.calendarConnection.findUnique({
    where: { userId_provider: { userId, provider: 'google' } },
  });

  if (!connection) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 404 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`,
  );

  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? undefined,
  });

  // Refresh token if expired
  if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: credentials.access_token ?? connection.accessToken,
          tokenExpiry: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : connection.tokenExpiry,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[Calendar] Token refresh error:', error);
      return NextResponse.json({ error: 'Failed to refresh Google token' }, { status: 401 });
    }
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Map Google colorId → our color names
  const GOOGLE_COLOR_MAP: Record<string, string> = {
    '1': 'purple',  // Lavender
    '2': 'green',   // Sage
    '3': 'purple',  // Grape
    '4': 'red',     // Flamingo
    '5': 'yellow',  // Banana
    '6': 'orange',  // Tangerine
    '7': 'blue',    // Peacock
    '8': 'indigo',  // Blueberry
    '9': 'green',   // Basil
    '10': 'red',    // Tomato
    '11': 'red',    // Flamingo
  };

  const timeMin = new Date();
  timeMin.setMonth(timeMin.getMonth() - 3);

  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 6);

  try {
    const response = await calendar.events.list({
      calendarId: connection.calendarId ?? 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items ?? [];

    // Parse all valid events upfront — no DB calls in the loop
    type ParsedEvent = {
      googleId: string;
      title: string;
      description: string | null;
      location: string | null;
      start: Date;
      end: Date;
      allDay: boolean;
      color: string;
      recurrence: string | null;
    };

    const parsed: ParsedEvent[] = [];
    for (const event of items) {
      if (!event.id || !event.summary) continue;
      const startRaw = event.start?.dateTime ?? event.start?.date;
      const endRaw = event.end?.dateTime ?? event.end?.date;
      if (!startRaw || !endRaw) continue;
      parsed.push({
        googleId: event.id,
        title: event.summary,
        description: event.description ?? null,
        location: event.location ?? null,
        start: new Date(startRaw),
        end: new Date(endRaw),
        allDay: !event.start?.dateTime,
        color: event.colorId ? (GOOGLE_COLOR_MAP[event.colorId] ?? 'blue') : 'blue',
        recurrence: event.recurrence ? event.recurrence.join(';') : null,
      });
    }

    // 1 query: find which googleIds already exist for this user
    const existingIds = new Set(
      (await prisma.calendarEvent.findMany({
        where: { userId, googleId: { in: parsed.map((e) => e.googleId) } },
        select: { googleId: true },
      })).map((e) => e.googleId)
    );

    const toCreate = parsed.filter((e) => !existingIds.has(e.googleId));
    const toUpdate = parsed.filter((e) => existingIds.has(e.googleId));
    const now = new Date();

    // 1 query: bulk insert new events
    if (toCreate.length > 0) {
      await prisma.calendarEvent.createMany({
        data: toCreate.map((e) => ({ ...e, userId, source: 'google' as const })),
        skipDuplicates: true,
      });
    }

    // 1 round-trip: batch all updates in a transaction
    if (toUpdate.length > 0) {
      await prisma.$transaction(
        toUpdate.map((e) =>
          prisma.calendarEvent.update({
            where: { googleId: e.googleId },
            data: {
              title: e.title,
              description: e.description,
              location: e.location,
              start: e.start,
              end: e.end,
              allDay: e.allDay,
              color: e.color,
              recurrence: e.recurrence,
              updatedAt: now,
            },
          })
        )
      );
    }

    const synced = parsed.length;

    await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: { lastSynced: new Date() },
    });

    return NextResponse.json({ synced });
  } catch (error) {
    console.error('[Calendar] Sync error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Google Calendar sync failed' }, { status: 500 });
  }
}
