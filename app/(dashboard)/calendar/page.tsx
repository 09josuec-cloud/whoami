import type { Metadata } from 'next';
import { Suspense } from 'react';
import CalendarClient from './components/CalendarClient';

export const metadata: Metadata = { title: 'Calendar' };

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarClient />
    </Suspense>
  );
}
