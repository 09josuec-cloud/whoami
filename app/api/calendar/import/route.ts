import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

interface ICSEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  allDay: boolean;
}

function parseICS(text: string): ICSEvent[] {
  const events: ICSEvent[] = [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Unfold long lines (lines starting with space/tab are continuations)
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  let inEvent = false;
  let current: Partial<ICSEvent> & { rawStart?: string; rawEnd?: string } = {};

  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (current.uid && current.summary && current.rawStart) {
        const allDay = current.rawStart.length === 8; // DATE format: YYYYMMDD
        const start = parseICSDate(current.rawStart);
        const rawEnd = current.rawEnd ?? current.rawStart;
        const end = parseICSDate(rawEnd);
        if (start && end) {
          events.push({
            uid: current.uid,
            summary: current.summary,
            start,
            end: allDay && end <= start ? new Date(start.getTime() + 86400000) : end,
            description: current.description,
            location: current.location,
            allDay,
          });
        }
      }
      continue;
    }
    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const prop = line.slice(0, colonIdx).split(';')[0].toUpperCase();
    const value = line.slice(colonIdx + 1).trim();

    switch (prop) {
      case 'UID':         current.uid = value; break;
      case 'SUMMARY':     current.summary = decodeICSText(value); break;
      case 'DESCRIPTION': current.description = decodeICSText(value) || undefined; break;
      case 'LOCATION':    current.location = decodeICSText(value) || undefined; break;
      case 'DTSTART':     current.rawStart = value.replace(/[TZ]/g, '').slice(0, 15); break;
      case 'DTEND':       current.rawEnd = value.replace(/[TZ]/g, '').slice(0, 15); break;
    }
  }

  return events;
}

function parseICSDate(raw: string): Date | null {
  // Formats: YYYYMMDD or YYYYMMDDHHmmss
  const clean = raw.replace(/\D/g, '');
  if (clean.length < 8) return null;
  const year = parseInt(clean.slice(0, 4), 10);
  const month = parseInt(clean.slice(4, 6), 10) - 1;
  const day = parseInt(clean.slice(6, 8), 10);
  const hour = clean.length >= 12 ? parseInt(clean.slice(8, 10), 10) : 0;
  const min = clean.length >= 12 ? parseInt(clean.slice(10, 12), 10) : 0;
  const d = new Date(year, month, day, hour, min);
  return isNaN(d.getTime()) ? null : d;
}

function decodeICSText(value: string): string {
  return value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const fileName = file instanceof File ? file.name : '';
  if (!fileName.endsWith('.ics')) {
    return NextResponse.json({ error: 'File must be an .ics file' }, { status: 400 });
  }

  const text = await file.text();
  const events = parseICS(text);

  if (events.length === 0) {
    return NextResponse.json({ error: 'No valid events found in file' }, { status: 400 });
  }

  let imported = 0;

  for (const event of events) {
    const icsKey = `ical:${event.uid}`;
    try {
      const existing = await prisma.calendarEvent.findFirst({
        where: { userId, source: 'ical', googleId: icsKey },
      });

      if (existing) {
        await prisma.calendarEvent.update({
          where: { id: existing.id },
          data: {
            title: event.summary,
            description: event.description ?? null,
            location: event.location ?? null,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
          },
        });
      } else {
        await prisma.calendarEvent.create({
          data: {
            userId,
            title: event.summary,
            description: event.description ?? null,
            location: event.location ?? null,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            source: 'ical',
            googleId: icsKey,
            color: 'purple',
          },
        });
      }
      imported++;
    } catch (error) {
      console.error('[Calendar] ICS upsert error:', event.summary, error);
    }
  }

  return NextResponse.json({ imported });
}
