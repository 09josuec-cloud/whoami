import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { google } from 'googleapis';
import { z } from 'zod';

const patchEventSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  allDay: z.boolean().optional(),
  color: z.string().max(50).optional(),
  recurrence: z.string().max(500).nullable().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[Calendar] GET event[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsedInput = patchEventSchema.safeParse(rawBody);
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsedInput.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const body = parsedInput.data;

  try {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (event.source !== 'local') {
      return NextResponse.json(
        { error: 'Edit in Google Calendar' },
        { status: 403 },
      );
    }

    const start = body.start ? new Date(body.start) : undefined;
    const end = body.end ? new Date(body.end) : undefined;

    if (start && isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    if (end && isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.location !== undefined && { location: body.location }),
        ...(start && { start }),
        ...(end && { end }),
        ...(body.allDay !== undefined && { allDay: body.allDay }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.recurrence !== undefined && { recurrence: body.recurrence }),
      },
    });

    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error('[Calendar] PATCH event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (event.source !== 'local') {
      return NextResponse.json(
        { error: 'Edit in Google Calendar' },
        { status: 403 },
      );
    }

    const googleId = event.googleId;
    await prisma.calendarEvent.delete({ where: { id } });

    // Try to delete from Google Calendar if it was pushed there
    if (googleId) {
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
          await gcal.events.delete({ calendarId: connection.calendarId ?? 'primary', eventId: googleId });
        }
      } catch (delErr) {
        console.error('[Calendar] Delete from Google failed (non-fatal):', delErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Calendar] DELETE event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
