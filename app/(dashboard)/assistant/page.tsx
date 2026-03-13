import type { Metadata } from 'next';
import AssistantClient from './AssistantClient';

export const metadata: Metadata = { title: 'AI Assistant' };

export default function AssistantPage() {
  return <AssistantClient />;
}
