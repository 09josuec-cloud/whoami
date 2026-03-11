import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { google } from 'googleapis';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateUserId = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/calendar?error=no_code', req.url));
  }

  // Try to get user from session first, fall back to state param
  const session = await auth();
  const userId = session?.user?.id ?? stateUserId;

  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`;

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

    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    await prisma.calendarConnection.upsert({
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

    // Trigger initial sync
    try {
      const syncUrl = `${process.env.NEXTAUTH_URL}/api/calendar/google/sync`;
      await fetch(syncUrl, {
        method: 'POST',
        headers: { Cookie: req.headers.get('cookie') ?? '' },
      });
    } catch {
      // Sync failure is non-fatal; user can sync manually
    }

    return NextResponse.redirect(new URL('/calendar?connected=true', req.url));
  } catch (error) {
    console.error('[Calendar] Google callback error:', error);
    return NextResponse.redirect(new URL('/calendar?error=auth_failed', req.url));
  }
}
