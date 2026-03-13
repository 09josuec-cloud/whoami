import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { google } from 'googleapis';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean().default(false),
  color: z.string().max(50).default('indigo'),
  recurrence: z.string().max(500).optional(),
});

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
    // Return events that overlap the requested range:
    // event starts before range end AND event ends after range start
    where.start = { lte: new Date(endParam) };
    where.end = { gte: new Date(startParam) };
  } else if (startParam) {
    where.end = { gte: new Date(startParam) };
  } else if (endParam) {
    where.start = { lte: new Date(endParam) };
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsedInput = createEventSchema.safeParse(rawBody);
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsedInput.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const body = parsedInput.data;

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
