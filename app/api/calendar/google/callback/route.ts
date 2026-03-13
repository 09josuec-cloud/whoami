import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { google } from 'googleapis';

async function syncGoogleEvents(userId: string, connectionId: string, oauth2Client: InstanceType<typeof google.auth.OAuth2>) {
  const connection = await prisma.calendarConnection.findUnique({ where: { id: connectionId } });
  if (!connection) return;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const timeMin = new Date();
  timeMin.setMonth(timeMin.getMonth() - 3);
  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 6);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: 500,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const items = response.data.items ?? [];

  for (const event of items) {
    if (!event.id || !event.summary) continue;
    const startRaw = event.start?.dateTime ?? event.start?.date;
    const endRaw = event.end?.dateTime ?? event.end?.date;
    if (!startRaw || !endRaw) continue;

    const allDay = !event.start?.dateTime;
    const start = new Date(startRaw);
    const end = new Date(endRaw);

    await prisma.calendarEvent.upsert({
      where: { googleId: event.id },
      update: {
        title: event.summary,
        description: event.description ?? null,
        location: event.location ?? null,
        start,
        end,
        allDay,
        recurrence: event.recurrence ? event.recurrence.join(';') : null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        title: event.summary,
        description: event.description ?? null,
        location: event.location ?? null,
        start,
        end,
        allDay,
        source: 'google',
        googleId: event.id,
        recurrence: event.recurrence ? event.recurrence.join(';') : null,
        color: 'blue',
      },
    });
  }

  await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: { lastSynced: new Date() },
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/calendar?error=no_code', req.url));
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const userId = session.user.id;

  // Verify the state parameter matches the authenticated user's ID to prevent CSRF
  if (!state || state !== userId) {
    return NextResponse.redirect(new URL('/calendar?error=state_mismatch', req.url));
  }
  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get('host')}`;
  const redirectUri = `${baseUrl}/api/calendar/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/calendar?error=no_token', req.url));
    }

    oauth2Client.setCredentials(tokens);

    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    const connection = await prisma.calendarConnection.upsert({
      where: { userId_provider: { userId, provider: 'google' } },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiry,
        updatedAt: new Date(),
      },
      create: {
        userId,
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry,
        calendarId: 'primary',
      },
    });

    // Sync inline — avoids HTTP cookie forwarding issues on Vercel
    try {
      await syncGoogleEvents(userId, connection.id, oauth2Client);
    } catch (syncError) {
      console.error('[Calendar] Initial sync error:', syncError);
      // Non-fatal — user can sync manually
    }

    return NextResponse.redirect(new URL('/calendar?connected=true', req.url));
  } catch (error) {
    console.error('[Calendar] Google callback error:', error);
    return NextResponse.redirect(new URL('/calendar?error=auth_failed', req.url));
  }
}
