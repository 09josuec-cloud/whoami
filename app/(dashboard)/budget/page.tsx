import type { Metadata } from 'next';
import BudgetClient from './components/BudgetClient';

export const metadata: Metadata = {
  title: 'Budget',
};

export default function BudgetPage() {
  return <BudgetClient />;
}
