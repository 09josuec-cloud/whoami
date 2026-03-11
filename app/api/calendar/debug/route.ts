import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { google } from 'googleapis';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  const userId = session.user.id;

  const connection = await prisma.calendarConnection.findUnique({
    where: { userId_provider: { userId, provider: 'google' } },
    select: {
      id: true,
      provider: true,
      calendarId: true,
      lastSynced: true,
      tokenExpiry: true,
      accessToken: true,
      refreshToken: true,
    },
  });

  if (!connection) {
    return NextResponse.json({ session: userId, connection: null });
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

  let apiTest: string;
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const res = await calendar.calendarList.list({ maxResults: 1 });
    apiTest = `OK — found ${res.data.items?.length ?? 0} calendars`;
  } catch (e) {
    apiTest = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    sessionUserId: userId,
    connection: {
      id: connection.id,
      hasAccessToken: !!connection.accessToken,
      hasRefreshToken: !!connection.refreshToken,
      tokenExpiry: connection.tokenExpiry,
      lastSynced: connection.lastSynced,
    },
    env: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nextauthUrl: process.env.NEXTAUTH_URL ?? 'NOT SET',
    },
    apiTest,
  });
}
