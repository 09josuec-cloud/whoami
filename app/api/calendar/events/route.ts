import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { google } from 'googleapis';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  const where: Record<string, unknown> = { userId: session.user.id };

  if (startParam && endParam) {
    where.start = { gte: new Date(startParam) };
    where.end = { lte: new Date(endParam) };
  } else if (startParam) {
    where.start = { gte: new Date(startParam) };
  } else if (endParam) {
    where.end = { lte: new Date(endParam) };
  }

  try {
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { start: 'asc' },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('[Calendar] GET events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

interface EventBody {
  title: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay?: boolean;
  color?: string;
  recurrence?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: EventBody;
  try {
    body = (await req.json()) as EventBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.title || !body.start || !body.end) {
    return NextResponse.json({ error: 'title, start, and end are required' }, { status: 400 });
  }

  const start = new Date(body.start);
  const end = new Date(body.end);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  if (end < start) {
    return NextResponse.json({ error: 'end must be after start' }, { status: 400 });
  }

  try {
    let event = await prisma.calendarEvent.create({
      data: {
        userId: session.user.id,
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        location: body.location?.trim() ?? null,
        start,
        end,
        allDay: body.allDay ?? false,
        color: body.color ?? 'indigo',
        source: 'local',
        recurrence: body.recurrence ?? null,
      },
    });

    // Try to push to Google Calendar if connected
    try {
      const connection = await prisma.calendarConnection.findUnique({
        where: { userId_provider: { userId: session.user.id, provider: 'google' } },
      });
      if (connection) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
        );
        oauth2Client.setCredentials({
          access_token: connection.accessToken,
          refresh_token: connection.refreshToken ?? undefined,
        });
        const gcal = google.calendar({ version: 'v3', auth: oauth2Client });
        const allDay = body.allDay ?? false;
        const gEvent = await gcal.events.insert({
          calendarId: connection.calendarId ?? 'primary',
          requestBody: {
            summary: event.title,
            description: event.description ?? undefined,
            location: event.location ?? undefined,
            start: allDay
              ? { date: start.toISOString().slice(0, 10) }
              : { dateTime: start.toISOString() },
            end: allDay
              ? { date: end.toISOString().slice(0, 10) }
              : { dateTime: end.toISOString() },
          },
        });
        if (gEvent.data.id) {
          event = await prisma.calendarEvent.update({
            where: { id: event.id },
            data: { googleId: gEvent.data.id },
          });
        }
      }
    } catch (pushErr) {
      console.error('[Calendar] Push to Google failed (non-fatal):', pushErr);
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('[Calendar] POST event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
