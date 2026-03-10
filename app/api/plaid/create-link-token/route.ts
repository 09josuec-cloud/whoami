import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { plaidClient } from '@/src/services/plaid/client';
import { CountryCode, Products } from 'plaid';

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: session.user.id,
        phone_number_verified_time: new Date().toISOString(),
        email_address_verified_time: new Date().toISOString(),
      },
      client_name: 'Whoami',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('[Plaid] create-link-token error:', error);
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}
