import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendSms(to: string, body: string): Promise<void> {
  const c = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!c || !from) {
    console.log(`[SMS dev] To: ${to} | ${body}`);
    return;
  }

  await c.messages.create({ to, from, body });
}
