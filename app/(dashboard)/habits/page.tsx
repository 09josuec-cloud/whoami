import type { Metadata } from 'next';
import HabitsClient from './components/HabitsClient';

export const metadata: Metadata = { title: 'Habits & Health' };

export default function HabitsPage() {
  return <HabitsClient />;
}
